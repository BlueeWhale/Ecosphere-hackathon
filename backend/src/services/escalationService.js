import { Deal } from '../models/Deal.js';
import { VoiceSession } from '../models/VoiceSession.js';
import { Conversation } from '../models/Conversation.js';
import { formatDealState } from './dealMemoryService.js';
import { emitDealUpdate } from './socketService.js';

/**
 * Builds a structured Escalation Context Pack for human sales representative takeover.
 */
export async function buildEscalationContextPack(dealId, sessionId, reason = 'Human sales assistance requested') {
  const deal = await Deal.findById(dealId);
  if (!deal) return null;

  const dealState = formatDealState(deal);

  let latestMessage = '';
  let summary = '';

  if (sessionId) {
    const session = await VoiceSession.findOne({ sessionId });
    if (session && session.transcriptTurns?.length > 0) {
      const turns = session.transcriptTurns;
      latestMessage = turns[turns.length - 1]?.text || '';
      summary = turns.slice(-4).map((t) => `${t.speaker.toUpperCase()}: ${t.text}`).join(' | ');
    }
  }

  return {
    dealId: deal._id,
    company: deal.company,
    customerName: deal.customerName || 'Prospect',
    customerEmail: deal.customerEmail || '',
    customerRole: deal.customerRole || '',
    dealStage: deal.currentStage,
    dealScore: deal.dealScore,
    buyingIntent: deal.buyingIntent,
    requirements: dealState.requirements,
    competitors: deal.competitors || [],
    objections: deal.objectionsList || [],
    pricingContext: deal.pricingContext,
    conversationSummary: summary || 'Active voice session in progress.',
    latestCustomerMessage: latestMessage || 'Customer requested human sales assistance.',
    nextBestAction: deal.nextBestAction,
    escalationReason: reason,
    triggeredAt: new Date(),
  };
}

/**
 * Triggers human escalation on a deal.
 */
export async function triggerEscalation({ dealId, sessionId, reason = 'Pricing policy approval limit exceeded', triggeredBy = 'AI_STRATEGIST' }) {
  const deal = await Deal.findById(dealId);
  if (!deal) return null;

  const contextPack = await buildEscalationContextPack(dealId, sessionId, reason);

  deal.escalation = {
    status: 'ESCALATION_REQUESTED',
    reason,
    triggeredBy,
    escalatedAt: new Date(),
    contextPack,
  };

  deal.nextBestAction = `HUMAN TAKEOVER REQUIRED: ${reason}`;
  await deal.save();

  const updatedState = formatDealState(deal);
  emitDealUpdate(deal._id.toString(), updatedState);

  return {
    success: true,
    escalation: deal.escalation,
    dealState: updatedState,
  };
}

/**
 * Processes human takeover of a live deal.
 */
export async function takeoverDeal({ dealId, userId }) {
  const deal = await Deal.findById(dealId);
  if (!deal) return null;

  deal.escalation = {
    ...(deal.escalation?.toObject?.() || deal.escalation || {}),
    status: 'HUMAN_CONNECTED',
    connectedAt: new Date(),
    connectedUser: userId,
  };

  deal.nextBestAction = 'Human sales rep active in call.';
  await deal.save();

  const updatedState = formatDealState(deal);
  emitDealUpdate(deal._id.toString(), updatedState);

  return {
    success: true,
    escalation: deal.escalation,
    dealState: updatedState,
  };
}
