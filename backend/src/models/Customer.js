import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
    name: { type: String, required: [true, 'Customer name is required'], trim: true },
    email: { type: String, required: [true, 'Customer email is required'], trim: true, lowercase: true },
    phone: { type: String, trim: true, default: '' },
    company: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['active', 'inactive', 'churned'], default: 'active' },
    industry: { type: String, trim: true, default: '' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Customer = mongoose.model('Customer', customerSchema);