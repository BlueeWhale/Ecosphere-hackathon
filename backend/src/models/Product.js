import mongoose from 'mongoose';
import { PRICING_TIERS } from '../constants/pricingConfig.js';

const volumeRuleSchema = new mongoose.Schema(
  {
    minUsers: { type: Number, required: true },
    maxUsers: { type: Number, required: true },
    discountPct: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Product name is required'], trim: true },
    description: { type: String, default: '' },
    plan: { type: String, default: 'Standard' }, // legacy field
    tier: {
      type: String,
      enum: ['STARTER', 'PROFESSIONAL', 'ENTERPRISE', 'GROWTH', 'ENTERPRISE_ANNUAL'],
      required: true,
      uppercase: true,
      unique: true,
    },
    price: { type: Number, required: [true, 'Price is required'], min: 0 }, // legacy monthly seat price
    pricePerUserMonthly: { type: Number, required: true, min: 0 },
    pricePerUserAnnual: { type: Number, required: true, min: 0 },
    priceAmount: { type: Number, required: true, min: 0 },
    pricePeriod: { type: String, enum: ['month', 'year'], required: true },
    sixMonthAmount: { type: Number, min: 0, default: null },
    currency: { type: String, default: 'USD' },
    minimumUsers: { type: Number, default: 1 },
    maximumUsers: { type: Number, default: 10000 },
    allowedBillingCycles: [{ type: String }],
    maximumDiscountPct: { type: Number, default: 15, min: 0, max: 100 },
    volumeDiscountRules: [volumeRuleSchema],
    features: [{ type: String }],
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
  },
  { timestamps: true }
);

export const Product = mongoose.model('Product', productSchema);

/**
 * Ensures the product catalog in MongoDB has the official DealPilot tiers.
 */
export async function seedDefaultProducts() {
  const defaultProducts = Object.values(PRICING_TIERS).map((t) => ({
    name: t.name,
    description: t.description,
    plan: t.name,
    tier: t.tier,
    price: t.pricePerUserMonthly ?? t.priceAmount,
    pricePerUserMonthly: t.pricePerUserMonthly ?? t.priceAmount,
    pricePerUserAnnual: t.pricePerUserAnnual ?? t.priceAmount,
    priceAmount: t.priceAmount,
    pricePeriod: t.pricePeriod,
    sixMonthAmount: t.sixMonthAmount,
    currency: 'USD',
    minimumUsers: t.minimumUsers,
    maximumUsers: t.maximumUsers,
    allowedBillingCycles: t.allowedBillingCycles,
    maximumDiscountPct: t.maximumDiscountPct,
    volumeDiscountRules: t.volumeDiscountRules,
    features: t.features,
    status: 'active',
  }));

  await Product.bulkWrite(defaultProducts.map((product) => ({
    updateOne: {
      filter: { tier: product.tier },
      update: { $set: product },
      upsert: true,
    },
  })));
  console.log('[Product Catalog Seeded]: Official DealPilot pricing tiers synchronized in MongoDB.');
}