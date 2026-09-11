import {
  PRICING_TIERS,
  SUPPORTED_TIERS,
  SUPPORTED_BILLING_CYCLES,
  BILLING_CYCLES,
  POLICY_STATUS,
} from '../constants/pricingConfig.js';

/**
 * Deterministic Pricing Engine Service
 *
 * Calculates deterministic pricing, applies volume brackets and billing rules,
 * enforces policy discount limits, and prevents unauthorized client price tampering.
 */
export function calculatePrice({
  planTier = 'ENTERPRISE',
  numberOfUsers = 1,
  billingCycle = 'ANNUAL',
  requestedDiscountPct = 0,
  commitmentMonths = null,
}) {
  // 1. Normalize and Validate Inputs
  const normalizedTier = String(planTier).toUpperCase().trim();
  const tierConfig = PRICING_TIERS[normalizedTier];
  if (!tierConfig) {
    const error = new Error(
      `Invalid planTier '${planTier}'. Supported tiers: ${SUPPORTED_TIERS.join(', ')}`
    );
    error.statusCode = 400;
    throw error;
  }

  const users = Number(numberOfUsers);
  if (!Number.isInteger(users) || users < 1) {
    const error = new Error('numberOfUsers must be a positive integer >= 1');
    error.statusCode = 400;
    throw error;
  }

  const normalizedCommitment = commitmentMonths === null || commitmentMonths === undefined
    ? null
    : Number(commitmentMonths);
  if (normalizedCommitment !== null && (!Number.isInteger(normalizedCommitment) || normalizedCommitment < 1)) {
    const error = new Error('commitmentMonths must be a positive integer');
    error.statusCode = 400;
    throw error;
  }

  let normalizedBilling = String(billingCycle || '').toUpperCase().trim();
  if (!normalizedBilling || normalizedBilling === 'UNKNOWN') {
    normalizedBilling = BILLING_CYCLES.ANNUAL;
  }
  if (!SUPPORTED_BILLING_CYCLES.includes(normalizedBilling)) {
    const error = new Error(
      `Invalid billingCycle '${billingCycle}'. Supported cycles: ${SUPPORTED_BILLING_CYCLES.join(', ')}`
    );
    error.statusCode = 400;
    throw error;
  }
  if (!tierConfig.allowedBillingCycles.includes(normalizedBilling)) {
    normalizedBilling = tierConfig.allowedBillingCycles[0];
  }

  const reqDiscount = Math.max(0, Math.min(100, Number(requestedDiscountPct) || 0));

  // 2. Determine Duration Months and Base Gross Amount
  let durationMonths = normalizedCommitment || 12;
  let baseAmount = tierConfig.priceAmount;

  if (normalizedCommitment !== null && normalizedCommitment < 12) {
    normalizedBilling = normalizedCommitment === 6 && tierConfig.sixMonthAmount
      ? BILLING_CYCLES.SIX_MONTH
      : BILLING_CYCLES.MONTHLY;
    durationMonths = normalizedCommitment;
    baseAmount = normalizedBilling === BILLING_CYCLES.SIX_MONTH
      ? tierConfig.sixMonthAmount
      : tierConfig.priceAmount;
  } else if (normalizedBilling === BILLING_CYCLES.MONTHLY) {
    durationMonths = 1;
    baseAmount = tierConfig.priceAmount;
  } else if (normalizedBilling === BILLING_CYCLES.SIX_MONTH) {
    durationMonths = 6;
    baseAmount = tierConfig.sixMonthAmount || tierConfig.priceAmount;
  } else if (normalizedBilling === BILLING_CYCLES.MULTI_YEAR) {
    durationMonths = 24;
    baseAmount = tierConfig.priceAmount * 2;
  }

  // 3. Determine Volume Discount
  let volumeDiscountPct = 0;
  if (Array.isArray(tierConfig.volumeDiscountRules)) {
    const matchedRule = tierConfig.volumeDiscountRules.find(
      (rule) => users >= rule.minUsers && users <= rule.maxUsers
    );
    if (matchedRule && durationMonths >= 12 && tierConfig.pricePeriod === 'year') {
      volumeDiscountPct = matchedRule.discountPct;
    }
  }

  // 4. Enforce Discount Policy Boundary
  const maxAllowedDiscountPct = tierConfig.maximumDiscountPct;
  let approvedDiscountPct = 0;
  let withinPolicy = true;
  let policyStatus = POLICY_STATUS.APPROVED;
  let policyReason = '';

  if (durationMonths < 12 && reqDiscount > 0) {
    approvedDiscountPct = 0;
    withinPolicy = false;
    policyStatus = POLICY_STATUS.REJECTED;
    policyReason = 'Monthly and six-month plans do not receive discounts. Annual plans are eligible for negotiation.';
  } else if (reqDiscount >= 15 && users < 200) {
    approvedDiscountPct = volumeDiscountPct;
    withinPolicy = false;
    policyStatus = POLICY_STATUS.REQUIRES_APPROVAL;
    policyReason = 'A 15% discount requires a 200+ user plan and commercial approval.';
  } else if (reqDiscount <= volumeDiscountPct) {
    // Standard volume discount applies
    approvedDiscountPct = volumeDiscountPct;
    withinPolicy = true;
    policyStatus = POLICY_STATUS.APPROVED;
    policyReason =
      volumeDiscountPct > 0
        ? `Standard ${volumeDiscountPct}% volume discount applied for ${users} user seats.`
        : 'Standard baseline pricing applied.';
  } else if (reqDiscount <= maxAllowedDiscountPct) {
    // Requested discount is within authorized sales threshold
    approvedDiscountPct = reqDiscount;
    withinPolicy = true;
    policyStatus = POLICY_STATUS.APPROVED;
    policyReason = `Requested discount of ${reqDiscount}% approved within authorized policy limit (${maxAllowedDiscountPct}%).`;
  } else {
    // Requested discount exceeds policy threshold! Cap strictly at maximum
    approvedDiscountPct = maxAllowedDiscountPct;
    withinPolicy = false;
    policyStatus = POLICY_STATUS.REQUIRES_APPROVAL;
    policyReason = `Requested discount of ${reqDiscount}% exceeds authorized policy ceiling of ${maxAllowedDiscountPct}%. Concession capped at ${maxAllowedDiscountPct}%; VP Sales / Deal Desk approval required for additional discounts.`;
  }

  // 5. Final Calculations
  const finalAmount = Math.round(baseAmount * (1 - approvedDiscountPct / 100));
  const totalSavings = Math.max(0, baseAmount - finalAmount);
  const effectivePerUserPerMonth =
    Math.round((finalAmount / (users * durationMonths)) * 100) / 100;

  // Minimum acceptable price based on maximum policy discount
  const minimumAcceptablePrice = Math.round(baseAmount * (1 - maxAllowedDiscountPct / 100));

  return {
    planTier: normalizedTier,
    planName: tierConfig.name,
    userCount: users,
    billingCycle: normalizedBilling,
    durationMonths,
    currency: 'USD',
    baseAmount,
    volumeDiscountPct,
    requestedDiscountPct: reqDiscount,
    approvedDiscountPct,
    finalAmount,
    totalSavings,
    effectivePerUserPerMonth,
    priceAmount: baseAmount,
    pricePeriod: normalizedBilling === BILLING_CYCLES.SIX_MONTH ? '6 months' : tierConfig.pricePeriod,
    withinPolicy,
    policyStatus,
    policyReason,
    // Negotiation metadata for future AI components (not exposed directly to customer)
    negotiationBounds: {
      minimumAcceptablePrice,
      maximumDiscountPct: maxAllowedDiscountPct,
      volumeDiscountPct,
      allowedBillingCycles: tierConfig.allowedBillingCycles,
      planFeatures: tierConfig.features,
    },
    quotedAt: new Date().toISOString(),
  };
}
