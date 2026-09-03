import { DEAL_STAGES, OBJECTION_TYPES } from '../constants/dealConstants.js';

/**
 * Computes deterministic Next Best Action based on the evolving Deal State.
 */
export function determineNextBestAction(deal) {
  const stage = deal.currentStage || deal.dealStage?.toUpperCase() || DEAL_STAGES.NEW;
  const objections = Array.isArray(deal.objectionsList)
    ? deal.objectionsList.filter((o) => !o.status || o.status === 'UNRESOLVED')
    : [];

  // 1. Closed Deals
  if (stage === DEAL_STAGES.CLOSED_WON) {
    return 'Send welcome package, onboarding schedule, and setup contract execution';
  }
  if (stage === DEAL_STAGES.CLOSED_LOST) {
    return 'Log loss reason and schedule a 6-month nurture re-engagement follow-up';
  }

  // 2. Demo Requested
  if (stage === DEAL_STAGES.DEMO_REQUESTED) {
    const focus = Array.isArray(deal.requiredFeatures) && deal.requiredFeatures.length > 0
      ? ` focusing on ${deal.requiredFeatures.slice(0, 2).join(' and ')}`
      : '';
    return `Confirm meeting invite and prepare tailored enterprise product demo${focus}`;
  }

  // 3. Unresolved Objections (Priority handling)
  const compObjection = objections.find((o) => o.type === OBJECTION_TYPES.COMPETITOR);
  if (compObjection) {
    const compName = Array.isArray(deal.competitors) && deal.competitors.length > 0
      ? deal.competitors.join(', ')
      : 'competitor';
    return `Present competitive battlecard highlighting unique differentiators vs ${compName}`;
  }

  const priceObjection = objections.find(
    (o) => o.type === OBJECTION_TYPES.PRICE || o.type === OBJECTION_TYPES.BUDGET
  );
  if (priceObjection) {
    if (deal.pricingContext?.policyStatus === 'REQUIRES_APPROVAL') {
      return `Escalate ${deal.pricingContext.requestedDiscountPct}% discount request to VP Sales or negotiate within ${deal.pricingContext.approvedDiscountPct}% policy limit`;
    }
    if (deal.pricingContext?.quotedAmount > 0) {
      return `Present approved quote of $${deal.pricingContext.quotedAmount.toLocaleString()} (${deal.pricingContext.offeredDiscountPct || deal.pricingContext.approvedDiscountPct}% off) to resolve pricing objection`;
    }
    return 'Offer Enterprise Volume Discount with annual commitment requirement';
  }

  // 4. Active Pricing Quote Follow-up
  if (deal.pricingContext?.policyStatus === 'REQUIRES_APPROVAL') {
    return `Escalate ${deal.pricingContext.requestedDiscountPct}% discount request to VP Sales or negotiate within ${deal.pricingContext.approvedDiscountPct}% policy limit`;
  }
  if (deal.pricingContext?.policyStatus === 'APPROVED' && deal.pricingContext?.quotedAmount > 0) {
    if (stage === DEAL_STAGES.NEGOTIATION || stage === DEAL_STAGES.EVALUATION) {
      return `Present formal approved quote of $${deal.pricingContext.quotedAmount.toLocaleString()} and propose onboarding kickoff`;
    }
  }

  const secObjection = objections.find((o) => o.type === OBJECTION_TYPES.TRUST_SECURITY);
  if (secObjection) {
    return 'Share enterprise security compliance whitepaper and SOC2/GDPR SLA documentation';
  }

  // 4. Negotiation Stage
  if (stage === DEAL_STAGES.NEGOTIATION) {
    return 'Finalize commercial proposal and present within allowable discount bounds';
  }

  // 5. Authority Gap
  if (deal.decisionMaker === false && !deal.decisionMakerName) {
    return 'Request introduction to primary technical and financial decision-makers';
  }

  // 6. High-value Enterprise Opportunity
  if (deal.numberOfUsers && Number(deal.numberOfUsers) >= 50) {
    return 'Offer Enterprise Volume Discount with annual commitment requirement';
  }

  // 7. Early Stage Discovery
  if (!deal.numberOfUsers || Number(deal.numberOfUsers) <= 1) {
    return 'Conduct discovery to qualify customer requirements and team size';
  }

  return 'Continue discovery to clarify timeline, required features, and budget bounds';
}
