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
      enum: ['STARTER', 'GROWTH', 'ENTERPRISE'],
      required: true,
      uppercase: true,
      unique: true,
    },
    price: { type: Number, required: [true, 'Price is required'], min: 0 }, // legacy monthly seat price
    pricePerUserMonthly: { type: Number, required: true, min: 0 },
    pricePerUserAnnual: { type: Number, required: true, min: 0 },
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
  const count = await Product.countDocuments();
  if (count > 0) return;

  const defaultProducts = Object.values(PRICING_TIERS).map((t) => ({
    name: t.name,
    description: t.description,
    plan: t.name,
    tier: t.tier,
    price: t.pricePerUserMonthly,
    pricePerUserMonthly: t.pricePerUserMonthly,
    pricePerUserAnnual: t.pricePerUserAnnual,
    currency: 'USD',
    minimumUsers: t.minimumUsers,
    maximumUsers: t.maximumUsers,
    allowedBillingCycles: t.allowedBillingCycles,
    maximumDiscountPct: t.maximumDiscountPct,
    volumeDiscountRules: t.volumeDiscountRules,
    features: t.features,
    status: 'active',
  }));

  await Product.insertMany(defaultProducts);
  console.log('[Product Catalog Seeded]: Starter, Growth, Enterprise tiers initialized in MongoDB.');
}