export const BILLING_CYCLES = {
  MONTHLY: 'MONTHLY',
  ANNUAL: 'ANNUAL',
  MULTI_YEAR: 'MULTI_YEAR',
};

export const POLICY_STATUS = {
  APPROVED: 'APPROVED',
  REQUIRES_APPROVAL: 'REQUIRES_APPROVAL',
  REJECTED: 'REJECTED',
};

export const PRICING_TIERS = {
  STARTER: {
    tier: 'STARTER',
    name: 'Starter Tier',
    description: 'Essential sales automation and lead qualification for small sales teams.',
    pricePerUserMonthly: 49,
    pricePerUserAnnual: 39, // $39/mo billed annually ($468/user/yr) - 20% discount
    minimumUsers: 1,
    maximumUsers: 20,
    allowedBillingCycles: ['MONTHLY', 'ANNUAL'],
    maximumDiscountPct: 10,
    volumeDiscountRules: [
      { minUsers: 1, maxUsers: 19, discountPct: 0 },
      { minUsers: 20, maxUsers: 20, discountPct: 5 },
    ],
    features: ['Standard AI Qualification', 'Basic CRM Sync', 'Email Follow-ups'],
  },
  GROWTH: {
    tier: 'GROWTH',
    name: 'Growth Tier',
    description: 'Advanced conversational sales intelligence with RAG knowledge integration.',
    pricePerUserMonthly: 99,
    pricePerUserAnnual: 79, // $79/mo billed annually ($948/user/yr) - 20% discount
    minimumUsers: 5,
    maximumUsers: 100,
    allowedBillingCycles: ['MONTHLY', 'ANNUAL'],
    maximumDiscountPct: 15,
    volumeDiscountRules: [
      { minUsers: 5, maxUsers: 19, discountPct: 0 },
      { minUsers: 20, maxUsers: 49, discountPct: 5 },
      { minUsers: 50, maxUsers: 100, discountPct: 10 },
    ],
    features: ['Adaptive AI Negotiation', 'RAG Knowledge Integration', 'Google Calendar Booking'],
  },
  ENTERPRISE: {
    tier: 'ENTERPRISE',
    name: 'Enterprise Suite',
    description: 'Comprehensive voice RTC sales agent with custom negotiation rules and human escalation.',
    pricePerUserMonthly: 199,
    pricePerUserAnnual: 159, // $159/mo billed annually ($1,908/user/yr) - 20% discount
    minimumUsers: 20,
    maximumUsers: 10000,
    allowedBillingCycles: ['MONTHLY', 'ANNUAL', 'MULTI_YEAR'],
    maximumDiscountPct: 25,
    volumeDiscountRules: [
      { minUsers: 20, maxUsers: 49, discountPct: 5 },
      { minUsers: 50, maxUsers: 199, discountPct: 15 },
      { minUsers: 200, maxUsers: 10000, discountPct: 20 },
    ],
    multiYearAdditionalDiscountPct: 5, // Additional 5% for 2+ year commitment
    features: ['Real-time Voice RTC', 'Custom Negotiation Rules', 'Human Agent Escalation'],
  },
};

export const SUPPORTED_TIERS = Object.keys(PRICING_TIERS);
export const SUPPORTED_BILLING_CYCLES = Object.values(BILLING_CYCLES);
