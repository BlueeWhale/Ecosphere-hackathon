import mongoose from 'mongoose';

const dealSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
    company: { type: String, required: [true, 'Company name is required'], trim: true },
    requirements: { type: String, default: '' },
    numberOfUsers: { type: Number, default: 1 },
    budget: { type: String, default: '' },
    productInterest: { type: String, default: '' },
    competitor: { type: String, default: '' },
    objections: { type: String, default: '' },
    intent: { type: String, enum: ['low', 'medium', 'high', 'unknown'], default: 'unknown' },
    dealStage: {
      type: String,
      enum: ['discovery', 'evaluation', 'proposal', 'negotiation', 'closed_won', 'closed_lost'],
      default: 'discovery',
    },
    sentiment: { type: String, enum: ['positive', 'neutral', 'negative'], default: 'neutral' },
    nextBestAction: { type: String, default: '' },
    status: { type: String, enum: ['open', 'won', 'lost'], default: 'open' },
  },
  { timestamps: true }
);

export const Deal = mongoose.model('Deal', dealSchema);