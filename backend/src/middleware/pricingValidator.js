import {
  SUPPORTED_TIERS,
  SUPPORTED_BILLING_CYCLES,
} from '../constants/pricingConfig.js';

export const validatePricingQuote = (req, res, next) => {
  const body = req.body;

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({
      success: false,
      message: 'Request body must be a valid JSON object',
    });
  }

  // 1. Anti-tampering check: Strip client-injected authoritative fields
  delete body.finalAmount;
  delete body.approvedDiscountPct;
  delete body.baseAmount;
  delete body.maximumDiscountPct;
  delete body.minimumAcceptablePrice;
  delete body.policyStatus;
  delete body.policyReason;

  // 2. Validate numberOfUsers
  if (body.numberOfUsers !== undefined && body.numberOfUsers !== null) {
    const parsed = Number(body.numberOfUsers);
    if (isNaN(parsed) || !Number.isInteger(parsed) || parsed < 1) {
      return res.status(400).json({
        success: false,
        message: 'numberOfUsers must be a positive integer (minimum 1)',
      });
    }
  }

  // 3. Validate planTier
  if (body.planTier !== undefined && body.planTier !== null) {
    const tier = String(body.planTier).toUpperCase().trim();
    if (!SUPPORTED_TIERS.includes(tier)) {
      return res.status(400).json({
        success: false,
        message: `Invalid planTier '${body.planTier}'. Supported tiers: ${SUPPORTED_TIERS.join(', ')}`,
      });
    }
    body.planTier = tier;
  }

  // 4. Validate billingCycle
  if (body.billingCycle !== undefined && body.billingCycle !== null) {
    const cycle = String(body.billingCycle).toUpperCase().trim();
    if (!SUPPORTED_BILLING_CYCLES.includes(cycle)) {
      return res.status(400).json({
        success: false,
        message: `Invalid billingCycle '${body.billingCycle}'. Supported cycles: ${SUPPORTED_BILLING_CYCLES.join(', ')}`,
      });
    }
    body.billingCycle = cycle;
  }

  // 5. Validate requestedDiscountPct
  if (body.requestedDiscountPct !== undefined && body.requestedDiscountPct !== null) {
    const discount = Number(body.requestedDiscountPct);
    if (isNaN(discount) || discount < 0 || discount > 100) {
      return res.status(400).json({
        success: false,
        message: 'requestedDiscountPct must be a number between 0 and 100',
      });
    }
    body.requestedDiscountPct = discount;
  }

  next();
};
