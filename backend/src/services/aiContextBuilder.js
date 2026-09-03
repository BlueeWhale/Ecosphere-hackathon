import { PRICING_TIERS } from '../constants/pricingConfig.js';

/**
 * Builds a sanitized, secure domain context payload for the AI model.
 * Never includes credentials, JWT secrets, database internals, or user passwords.
 */
export function buildAIContext(deal) {
  const planTier = (deal.product || deal.pricingContext?.planTier || 'ENTERPRISE').toUpperCase();
  const tierConfig = PRICING_TIERS[planTier] || PRICING_TIERS.ENTERPRISE;

  const unresolvedObjections = Array.isArray(deal.objectionsList)
    ? deal.objectionsList
        .filter((o) => !o.status || o.status === 'UNRESOLVED')
        .map((o) => ({ type: o.type, text: o.text }))
    : [];

  const catalogSummary = Object.values(PRICING_TIERS).map((t) => ({
    tier: t.tier,
    name: t.name,
    monthlyPerUser: t.pricePerUserMonthly,
    annualPerUserPerMonth: t.pricePerUserAnnual,
    minUsers: t.minimumUsers,
    features: t.features,
    maximumAllowedDiscount: `${t.maximumDiscountPct}%`,
  }));

  return {
    customer: {
      name: deal.customerName || 'Customer',
      company: deal.company || 'Prospective Account',
      role: deal.customerRole || 'Stakeholder',
      decisionMaker: !!deal.decisionMaker,
    },
    deal: {
      stage: deal.currentStage || 'NEW',
      score: deal.dealScore ?? 10,
      buyingIntent: deal.buyingIntent || 'UNKNOWN',
      requirements: {
        numberOfUsers: deal.numberOfUsers || 1,
        product: deal.product || tierConfig.name,
        requiredFeatures: deal.requiredFeatures || [],
        timeline: deal.timeline || 'Not specified',
        budget: deal.budget || 'Not specified',
      },
      competitors: deal.competitors || [],
      unresolvedObjections,
    },
    pricingContext: {
      quotedAmount: deal.pricingContext?.quotedAmount || 0,
      planTier: deal.pricingContext?.planTier || planTier,
      billingCycle: deal.pricingContext?.billingCycle || 'annual',
      offeredDiscountPct: deal.pricingContext?.offeredDiscountPct || 0,
      volumeDiscountPct: deal.pricingContext?.volumeDiscountPct || 0,
      policyStatus: deal.pricingContext?.policyStatus || 'PENDING',
      authorizedDiscountCeilingPct: tierConfig.maximumDiscountPct,
      currency: deal.pricingContext?.currency || 'USD',
    },
    catalog: catalogSummary,
  };
}
