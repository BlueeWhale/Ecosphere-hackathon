import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: { type: String, required: [true, 'Email is required'], trim: true, lowercase: true },
    phone: { type: String, trim: true, default: '' },
    company: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'],
      default: 'new',
    },
    intent: { type: String, enum: ['low', 'medium', 'high', 'unknown'], default: 'unknown' },
    leadScore: { type: Number, min: 0, max: 100, default: 0 },
    source: { type: String, default: 'inbound' },
    lastContact: { type: Date },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Lead = mongoose.model('Lead', leadSchema);