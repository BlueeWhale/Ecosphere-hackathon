import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Product name is required'], trim: true },
    description: { type: String, default: '' },
    plan: { type: String, default: 'Standard' },
    price: { type: Number, required: [true, 'Price is required'], min: 0 },
    currency: { type: String, default: 'USD' },
    minimumUsers: { type: Number, default: 1 },
    maximumUsers: { type: Number, default: 100 },
    features: [{ type: String }],
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
  },
  { timestamps: true }
);

export const Product = mongoose.model('Product', productSchema);