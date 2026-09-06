import { Deal } from '../models/Deal.js';
import * as factory from './factoryController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as dealMemoryService from '../services/dealMemoryService.js';
import { calculateDealScore } from '../services/dealScoreService.js';
import { determineNextBestAction } from '../services/nextBestActionService.js';
import { calculatePrice } from '../services/pricingService.js';
import { extractAdaptiveSignals } from '../services/adaptiveConversationService.js';
import { buildCompetitorComparison } from '../services/competitorComparisonService.js';

function adaptiveStateUpdates(message, deal) {
  const signals = extractAdaptiveSignals(message, deal, []);
  return {
    adaptiveContext: {
      priority: signals.priority || deal.adaptiveContext?.priority || null,
      expansionPotential: signals.expansionPotential,
      comparisonRequested: signals.comparisonRequested,
      pricePressure: signals.pricePressure,
      comparison: signals.comparison,
      mainConcern: signals.mainConcern,
      hiddenConcern: signals.hiddenConcern,
      trustMode: signals.trustMode,
      buyingStage: signals.buyingStage,
      lastAction: signals.recommendedAction,
    },
    ...(signals.extractedRequirements?.numberOfUsers ? { numberOfUsers: signals.extractedRequirements.numberOfUsers } : {}),
    ...(signals.buyingIntent && signals.buyingIntent !== 'UNKNOWN' ? { buyingIntent: signals.buyingIntent } : {}),
    ...(signals.asksForDemo ? { currentStage: 'DEMO_REQUESTED' } : {}),
  };
}

export const getDeals = factory.getAll(Deal);
export const getDeal = factory.getOne(Deal);
export const updateDeal = factory.updateOne(Deal);
export const deleteDeal = factory.deleteOne(Deal);

// Custom createDeal that sets user ownership and initial score
export const createDeal = asyncHandler(async (req, res) => {
  const dealData = { ...req.body };
  if (req.user) {
    dealData.user = req.user._id || req.user.id;
    if (req.user.role !== 'admin') {
      dealData.tenantId = req.user.tenantId;
      delete dealData.tenantId;
      dealData.tenantId = req.user.tenantId;
    }
  }

  const deal = new Deal(dealData);
  const scoreResult = calculateDealScore(deal);
  deal.dealScore = scoreResult.score;
  deal.dealScoreBreakdown = scoreResult.breakdown;

  if (!deal.nextBestAction) {
    deal.nextBestAction = determineNextBestAction(deal);
  }

  await deal.save();
  res.status(201).json({ success: true, data: deal });
});

// GET /api/deals/:id/state
export const getDealState = asyncHandler(async (req, res) => {
  const state = await dealMemoryService.getDealState(
    req.params.id,
    req.user?._id || req.user?.id,
    req.user?.role
  );
  res.status(200).json({ success: true, data: state });
});

// PATCH /api/deals/:id/state
export const updateDealState = asyncHandler(async (req, res) => {
  const updatedState = await dealMemoryService.updateDealMemory(
    req.params.id,
    req.body,
    req.user?._id || req.user?.id,
    req.user?.role
  );
  res.status(200).json({ success: true, data: updatedState });
});

// POST /api/deals/:id/pricing/quote
export const generateDealQuote = asyncHandler(async (req, res) => {
  const deal = await Deal.findById(req.params.id);
  if (!deal) {
    res.status(404);
    throw new Error('Deal not found');
  }

  // Ownership verification
  if (req.user.role !== 'admin' && deal.user && !deal.user.equals(req.user._id || req.user.id)) {
    res.status(403);
    throw new Error('Not authorized to generate quote for this deal');
  }

  // If deal had no user set yet, associate with current user
  if (!deal.user) {
    deal.user = req.user._id || req.user.id;
  }

  // Determine parameters (fallback to deal's existing values if not provided)
  const planTier = req.body.planTier || deal.product || deal.productInterest || 'ENTERPRISE';
  const numberOfUsers = req.body.numberOfUsers || deal.numberOfUsers || 1;
  const billingCycle = req.body.billingCycle || deal.pricingContext?.billingCycle || 'ANNUAL';
  const requestedDiscountPct = req.body.requestedDiscountPct !== undefined ? req.body.requestedDiscountPct : 0;

  // Run deterministic pricing calculation
  const quote = calculatePrice({
    planTier,
    numberOfUsers,
    billingCycle,
    requestedDiscountPct,
  });

  // Persist quote into Deal pricingContext
  deal.numberOfUsers = quote.userCount;
  deal.product = quote.planTier;
  deal.productInterest = quote.planName;
  deal.pricingContext = {
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
    specialTerms: req.body.specialTerms || deal.pricingContext?.specialTerms || '',
    quotedAt: new Date(),
  };

  // Re-calculate deal score and next best action
  const scoreResult = calculateDealScore(deal);
  deal.dealScore = scoreResult.score;
  deal.dealScoreBreakdown = scoreResult.breakdown;
  deal.nextBestAction = determineNextBestAction(deal);
  deal.lastMemoryUpdate = new Date();

  await deal.save();

  res.status(200).json({
    success: true,
    data: {
      quote,
      dealState: dealMemoryService.formatDealState(deal),
    },
  });
});

// POST /api/deals/:id/ai/analyze
export const analyzeMessageForDeal = asyncHandler(async (req, res) => {
  const { message, applyUpdates } = req.body;
  if (!message || typeof message !== 'string' || !message.trim()) {
    res.status(400);
    throw new Error('message is required and must be a non-empty string');
  }

  const deal = await Deal.findById(req.params.id);
  if (!deal) {
    res.status(404);
    throw new Error('Deal not found');
  }

  // Ownership verification
  if (req.user.role !== 'admin' && deal.user && !deal.user.equals(req.user._id || req.user.id)) {
    res.status(403);
    throw new Error('Not authorized to access this deal');
  }

  const { analyzeCustomerMessage } = await import('../services/aiStrategistService.js');
  const analysis = await analyzeCustomerMessage({
    customerMessage: message,
    deal,
  });

  const stateUpdates = {};
  if (analysis.extractedRequirements?.numberOfUsers) {
    stateUpdates.numberOfUsers = analysis.extractedRequirements.numberOfUsers;
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
  Object.assign(stateUpdates, adaptiveStateUpdates(message, deal));

  let updatedState = dealMemoryService.formatDealState(deal);
  if (applyUpdates === true && Object.keys(stateUpdates).length > 0) {
    updatedState = await dealMemoryService.updateDealMemory(
      deal._id,
      stateUpdates,
      req.user._id || req.user.id,
      req.user.role
    );
  }

  res.status(200).json({
    success: true,
    data: {
      analysis,
      stateUpdates,
      dealState: updatedState,
    },
  });
});

// POST /api/deals/:id/ai/respond
export const respondToCustomer = asyncHandler(async (req, res) => {
  const { message, applyUpdates = true } = req.body;
  if (!message || typeof message !== 'string' || !message.trim()) {
    res.status(400);
    throw new Error('message is required and must be a non-empty string');
  }

  const deal = await Deal.findById(req.params.id);
  if (!deal) {
    res.status(404);
    throw new Error('Deal not found');
  }

  // Ownership verification
  if (req.user.role !== 'admin' && deal.user && !deal.user.equals(req.user._id || req.user.id)) {
    res.status(403);
    throw new Error('Not authorized to access this deal');
  }

  const { analyzeCustomerMessage, generateSalesResponse } = await import('../services/aiStrategistService.js');

  // 1. Analyze message
  const analysis = await analyzeCustomerMessage({
    customerMessage: message,
    deal,
  });

  // 2. Propose & apply state updates through existing dealMemoryService
  let currentDeal = deal;
  if (applyUpdates) {
    const stateUpdates = {};
    if (analysis.extractedRequirements?.numberOfUsers) {
      stateUpdates.numberOfUsers = analysis.extractedRequirements.numberOfUsers;
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
    Object.assign(stateUpdates, adaptiveStateUpdates(message, deal));

    if (Object.keys(stateUpdates).length > 0) {
      await dealMemoryService.updateDealMemory(
        deal._id,
        stateUpdates,
        req.user._id || req.user.id,
        req.user.role
      );
      currentDeal = await Deal.findById(deal._id);
    }

    // 3. If discount was requested, pass strictly through pricingService (LLM never sets price)
    if (analysis.requestedDiscountPct !== null) {
      const rawCycle = currentDeal.pricingContext?.billingCycle?.toUpperCase();
      const cycle = (rawCycle && rawCycle !== 'UNKNOWN') ? rawCycle : 'ANNUAL';
      const quote = calculatePrice({
        planTier: currentDeal.product || currentDeal.pricingContext?.planTier || 'ENTERPRISE',
        numberOfUsers: currentDeal.numberOfUsers || 1,
        billingCycle: cycle,
        requestedDiscountPct: analysis.requestedDiscountPct,
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
        quotedAt: new Date(),
      };

      const scoreResult = calculateDealScore(currentDeal);
      currentDeal.dealScore = scoreResult.score;
      currentDeal.dealScoreBreakdown = scoreResult.breakdown;
      currentDeal.nextBestAction = determineNextBestAction(currentDeal);
      currentDeal.lastMemoryUpdate = new Date();
      await currentDeal.save();
    }
  }

  // 4. Generate grounded response
  if (
    (analysis.comparisonRequested || currentDeal.adaptiveContext?.comparison === 'ACTIVE' || currentDeal.competitors?.length > 0) &&
    (analysis.competitors?.length > 0 || currentDeal.competitors?.length > 0)
  ) {
    const comparison = await buildCompetitorComparison(
      currentDeal,
      analysis.competitors?.[0] || currentDeal.competitors?.[0]
    );
    if (comparison) {
      currentDeal.adaptiveContext = {
        ...(currentDeal.adaptiveContext || {}),
        comparisonData: comparison,
      };
      await currentDeal.save();
    }
  }

  const responseResult = await generateSalesResponse({
    customerMessage: message,
    deal: currentDeal,
    analysis,
  });

  const responseText = String(responseResult?.text || responseResult || '');
  const sources = Array.isArray(responseResult?.sources) ? responseResult.sources : [];

  res.status(200).json({
    success: true,
    data: {
      response: responseText,
      sources,
      analysis,
      dealState: dealMemoryService.formatDealState(currentDeal),
    },
  });
});