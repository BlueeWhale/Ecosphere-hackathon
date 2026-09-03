import { BUYING_INTENT } from '../constants/dealConstants.js';

/**
 * Calculates a deterministic, explainable Deal Score between 0 and 100.
 *
 * Rubric:
 * - Base: 10 pts
 * - Buying Intent: up to +30 pts (VERY_HIGH: 30, HIGH: 20, MEDIUM: 10, LOW/UNKNOWN: 0)
 * - Requirements Clarity: up to +20 pts
 *     - Specified user count (> 1): +10
 *     - At least 1 required feature: +5
 *     - Product tier / interest stated: +5
 * - Budget Availability: +15 pts (if budget non-empty)
 * - Authority (Decision Maker): up to +15 pts
 *     - decisionMaker === true: +15
 *     - OR decisionMakerName non-empty: +10
 * - Timeline Clarity: +10 pts (if timeline non-empty)
 * - Objection Penalty: -5 pts for each UNRESOLVED objection (capped at -20 pts)
 */
export function calculateDealScore(deal) {
  const breakdown = {
    base: 10,
    intent: 0,
    requirements: 0,
    budget: 0,
    authority: 0,
    timeline: 0,
    objectionPenalty: 0,
  };

  // 1. Buying Intent (max 30)
  const intent = (deal.buyingIntent || deal.intent || '').toUpperCase();
  if (intent === BUYING_INTENT.VERY_HIGH) {
    breakdown.intent = 30;
  } else if (intent === BUYING_INTENT.HIGH) {
    breakdown.intent = 20;
  } else if (intent === BUYING_INTENT.MEDIUM) {
    breakdown.intent = 10;
  }

  // 2. Requirements Clarity (max 20)
  if (deal.numberOfUsers && Number(deal.numberOfUsers) > 1) {
    breakdown.requirements += 10;
  }
  if (Array.isArray(deal.requiredFeatures) && deal.requiredFeatures.length > 0) {
    breakdown.requirements += 5;
  }
  if (deal.product || deal.productInterest) {
    breakdown.requirements += 5;
  }

  // 3. Budget Availability (max 15)
  if (deal.budget && typeof deal.budget === 'string' && deal.budget.trim() !== '') {
    breakdown.budget = 15;
  }

  // 4. Authority (max 15)
  if (deal.decisionMaker === true) {
    breakdown.authority = 15;
  } else if (deal.decisionMakerName && deal.decisionMakerName.trim() !== '') {
    breakdown.authority = 10;
  }

  // 5. Timeline Clarity (max 10)
  if (deal.timeline && typeof deal.timeline === 'string' && deal.timeline.trim() !== '') {
    breakdown.timeline = 10;
  }

  // 6. Objection Penalty (up to -20)
  if (Array.isArray(deal.objectionsList)) {
    const unresolvedCount = deal.objectionsList.filter(
      (obj) => !obj.status || obj.status === 'UNRESOLVED'
    ).length;
    breakdown.objectionPenalty = -Math.min(20, unresolvedCount * 5);
  }

  const rawScore =
    breakdown.base +
    breakdown.intent +
    breakdown.requirements +
    breakdown.budget +
    breakdown.authority +
    breakdown.timeline +
    breakdown.objectionPenalty;

  const score = Math.max(0, Math.min(100, rawScore));

  return {
    score,
    breakdown,
  };
}
