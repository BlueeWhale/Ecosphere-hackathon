import { Deal } from '../models/Deal.js';
import { VoiceSession } from '../models/VoiceSession.js';
import { Conversation } from '../models/Conversation.js';
import * as aiStrategistService from './aiStrategistService.js';
import * as dealMemoryService from './dealMemoryService.js';
import { calculatePrice } from './pricingService.js';
import { calculateDealScore } from './dealScoreService.js';
import { determineNextBestAction } from './nextBestActionService.js';
import { extractAdaptiveSignals, getPendingQuestionState, resolvePlanTier } from './adaptiveConversationService.js';
import { buildCompetitorComparison } from './competitorComparisonService.js';

/**
 * Voice Processing Pipeline
 * Connects Speech-to-Text transcript to DealPilot AI Strategist,
 * updates Deal Memory and Pricing Engine, and produces the agent response.
 */
export async function processVoiceTurn({
  dealId,
  userId,
  userRole,
  sessionId,
  customerTranscript,
}) {
  if (!customerTranscript || typeof customerTranscript !== 'string' || !customerTranscript.trim()) {
    const error = new Error('customerTranscript must be a non-empty string');
    error.statusCode = 400;
    throw error;
  }

  const deal = await Deal.findById(dealId);
  if (!deal) {
    const error = new Error('Deal not found');
    error.statusCode = 404;
    throw error;
  }

  const existingConversation = sessionId
    ? await Conversation.findOne({ deal: deal._id, sessionId })
    : null;
  const conversationHistory = existingConversation?.transcript || [];
  const liveSession = sessionId ? await VoiceSession.findOne({ sessionId }) : null;
  if (liveSession?.handoff?.status === 'CONNECTED') {
    return {
      response: '',
      ttsText: '',
      analysis: { handoffRequired: false, handoffStatus: 'CONNECTED' },
      dealState: dealMemoryService.formatDealState(deal),
      transcriptTurns: liveSession.transcriptTurns,
    };
  }

  // 1. Analyze voice transcript with AI Strategist
  const analysis = await aiStrategistService.analyzeCustomerMessage({
    customerMessage: customerTranscript,
    deal,
    conversationHistory,
  });

  const adaptiveSignals = extractAdaptiveSignals(customerTranscript, deal, conversationHistory);
  if (adaptiveSignals.handoffRequired) analysis.intent = 'HUMAN_ESCALATION';

  // 2. Prepare structured state updates
  const stateUpdates = {};
  if (analysis.extractedRequirements?.numberOfUsers || adaptiveSignals.extractedRequirements?.numberOfUsers) {
    stateUpdates.numberOfUsers = analysis.extractedRequirements?.numberOfUsers || adaptiveSignals.extractedRequirements.numberOfUsers;
  }
  if (analysis.extractedRequirements?.requiredFeatures?.length > 0) {
    stateUpdates.requirements = {
      requiredFeatures: analysis.extractedRequirements.requiredFeatures,
    };
  }
  if (analysis.extractedRequirements?.timeline) {
    stateUpdates.timeline = analysis.extractedRequirements.timeline;
  }
  if (analysis.extractedRequirements?.budget) {
    stateUpdates.budget = analysis.extractedRequirements.budget;
  }
  if (analysis.competitors?.length > 0) {
    stateUpdates.competitors = analysis.competitors;
  }
  if (analysis.objections?.length > 0) {
    stateUpdates.objections = analysis.objections;
  }
  stateUpdates.adaptiveContext = {
    priority: adaptiveSignals.priority || deal.adaptiveContext?.priority || null,
    expansionPotential: adaptiveSignals.expansionPotential,
    comparisonRequested: adaptiveSignals.comparisonRequested,
    pricePressure: adaptiveSignals.pricePressure,
    comparison: adaptiveSignals.comparison,
    mainConcern: adaptiveSignals.mainConcern,
    hiddenConcern: adaptiveSignals.hiddenConcern,
    trustMode: adaptiveSignals.trustMode,
    buyingStage: adaptiveSignals.buyingStage,
    commitmentMonths: adaptiveSignals.commitmentMonths,
    commitmentEligible: adaptiveSignals.commitmentEligible,
    pricePriority: adaptiveSignals.priority === 'pricing' || adaptiveSignals.priority === 'price',
    lastAction: adaptiveSignals.recommendedAction,
  };
  if (adaptiveSignals.buyingIntent && adaptiveSignals.buyingIntent !== 'UNKNOWN') {
    stateUpdates.buyingIntent = adaptiveSignals.buyingIntent;
  }
  if (adaptiveSignals.asksForDemo) stateUpdates.currentStage = 'DEMO_REQUESTED';

  // 3. Apply state updates to Deal Memory
  let updatedDealState = dealMemoryService.formatDealState(deal);
  if (Object.keys(stateUpdates).length > 0) {
    updatedDealState = await dealMemoryService.updateDealMemory(
      deal._id,
      stateUpdates,
      userId || deal.user,
      userRole || 'admin'
    );
  }

  const currentDeal = await Deal.findById(deal._id);

  if (
    (adaptiveSignals.comparisonRequested || currentDeal.adaptiveContext?.comparison === 'ACTIVE' || currentDeal.competitors?.length > 0) &&
    (adaptiveSignals.competitors.length > 0 || currentDeal.competitors?.length > 0)
  ) {
    try {
      const comparison = await buildCompetitorComparison(currentDeal, adaptiveSignals.competitors[0] || currentDeal.competitors[0]);
      if (comparison) {
        currentDeal.adaptiveContext = {
          ...(currentDeal.adaptiveContext || {}),
          comparisonData: comparison,
        };
        await currentDeal.save();
        updatedDealState = dealMemoryService.formatDealState(currentDeal);
      }
    } catch (comparisonError) {
      console.warn('[Competitor Comparison Warning]: Unable to build comparison.', comparisonError.message);
    }
  }

  // 4. If discount requested, pass strictly through deterministic pricing engine
  if (analysis.requestedDiscountPct !== null || adaptiveSignals.pricingRequested || adaptiveSignals.requirementChanged) {
    const rawCycle = currentDeal.pricingContext?.billingCycle?.toUpperCase();
    const cycle = (rawCycle && rawCycle !== 'UNKNOWN') ? rawCycle : 'ANNUAL';
    const requestedDiscountPct = adaptiveSignals.commitmentEligible
      ? (analysis.requestedDiscountPct ?? 0)
      : 0;

    const quote = calculatePrice({
      planTier: resolvePlanTier(currentDeal, currentDeal.numberOfUsers || 1),
      numberOfUsers: currentDeal.numberOfUsers || 1,
      billingCycle: cycle,
      requestedDiscountPct,
      commitmentMonths: adaptiveSignals.commitmentMonths,
    });

    currentDeal.pricingContext = {
      quotedAmount: quote.finalAmount,
      baseAmount: quote.baseAmount,
      currency: quote.currency,
      offeredDiscountPct: quote.approvedDiscountPct,
      volumeDiscountPct: quote.volumeDiscountPct,
      requestedDiscountPct: quote.requestedDiscountPct,
      approvedDiscountPct: quote.approvedDiscountPct,
      userCount: quote.userCount,
      planTier: quote.planTier,
      billingCycle: quote.billingCycle.toLowerCase(),
      policyStatus: quote.policyStatus,
      policyReason: quote.policyReason,
      specialTerms: currentDeal.pricingContext?.specialTerms || '',
      standardPrice: quote.baseAmount,
      currentOffer: quote.finalAmount,
      discountGiven: quote.approvedDiscountPct,
      minimumPrice: quote.negotiationBounds.minimumAcceptablePrice,
      customerConcession: currentDeal.pricingContext?.customerConcession || '',
      companyConcession: `${quote.approvedDiscountPct}% approved discount under current policy`,
      quotedAt: new Date(),
    };

    const scoreResult = calculateDealScore(currentDeal);
    currentDeal.dealScore = scoreResult.score;
    currentDeal.dealScoreBreakdown = scoreResult.breakdown;
    currentDeal.nextBestAction = determineNextBestAction(currentDeal);
    currentDeal.lastMemoryUpdate = new Date();
    await currentDeal.save();
    updatedDealState = dealMemoryService.formatDealState(currentDeal);
  }

  // 4.1 Route Action Layer (Google Calendar / Escalation / Pricing)
  if (['DEMO_REQUEST', 'BOOKING_CONFIRMED', 'PRICE_NEGOTIATION', 'HUMAN_ESCALATION'].includes(analysis.intent)) {
    try {
      const { routeAction } = await import('./actionRouterService.js');
      const actionRes = await routeAction({
        dealId: currentDeal._id.toString(),
        sessionId,
        actionType: analysis.intent,
        payload: {
          requestedDiscountPct: analysis.requestedDiscountPct,
          reason: analysis.objections?.[0]?.statement || 'Action triggered from voice session',
          currentCustomerMessage: customerTranscript,
        },
        actionId: `voice_turn_${sessionId}_${Date.now()}`,
      });
      if (actionRes?.dealState) {
        updatedDealState = actionRes.dealState;
      }
    } catch (actErr) {
      console.warn('[Action Router Warning]: Error routing voice action:', actErr.message);
    }
  }

  // 5. Generate Grounded AI Sales Response
  const agentResponse = await aiStrategistService.generateSalesResponse({
    customerMessage: customerTranscript,
    deal: currentDeal,
    analysis,
    conversationHistory,
  });
  const agentResponseText = adaptiveSignals.handoffRequired
    ? `I understand. ${adaptiveSignals.handoffReason}. I'll connect you with a specialist now and share everything we've discussed so you won't need to repeat yourself.`
    : agentResponse?.text || String(agentResponse || '');
  currentDeal.adaptiveContext = {
    ...(currentDeal.adaptiveContext || {}),
    ...getPendingQuestionState(agentResponseText),
  };
  await currentDeal.save();

  // 6. Persist turns to VoiceSession in MongoDB
  let sessionTurns = [];
  if (sessionId) {
    const session = await VoiceSession.findOne({ sessionId });
    if (session) {
      if (adaptiveSignals.handoffRequired) {
        session.handoff = { status: 'REQUESTED', reason: adaptiveSignals.handoffReason, requestedAt: new Date() };
      }
      session.transcriptTurns.push(
        {
          speaker: 'customer',
          text: customerTranscript,
          timestamp: new Date(),
        },
        {
          speaker: 'agent',
          text: agentResponseText,
          intent: analysis.intent,
          detectedObjections: analysis.objections?.map((o) => o.type) || [],
          timestamp: new Date(),
        }
      );
      session.status = 'active';
      await session.save();
      sessionTurns = session.transcriptTurns;
    }
  }

  // 7. Persist turns to Conversation in MongoDB
  let conversation = existingConversation;
  if (!conversation) {
    conversation = new Conversation({
      deal: deal._id,
      user: userId,
      tenantId: deal.tenantId,
      sessionId,
      startedAt: new Date(),
      status: 'active',
      transcript: [],
    });
  }
  conversation.transcript.push(
    { speaker: 'customer', text: customerTranscript, timestamp: new Date() },
    { speaker: 'agent', text: agentResponseText, timestamp: new Date() }
  );
  conversation.intent = analysis.intent;
  await conversation.save();

  try {
    const { emitTranscriptTurn, emitDealUpdate } = await import('./socketService.js');
    if (sessionId) {
      emitTranscriptTurn(sessionId, {
        customer: customerTranscript,
        agent: agentResponseText,
        intent: analysis.intent,
        timestamp: new Date(),
      });
    }
    emitDealUpdate(deal._id.toString(), updatedDealState);
  } catch (_) {}

  return {
    response: agentResponse,
    ttsText: agentResponseText,
    analysis,
    dealState: updatedDealState,
    transcriptTurns: sessionTurns,
  };
}
