import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    deal: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal', index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
    sessionId: { type: String, index: true },
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
    duration: { type: Number, default: 0 },
    transcript: [
      {
        speaker: { type: String, enum: ['agent', 'customer', 'system'], required: true },
        text: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    intent: { type: String, default: 'unknown' },
    outcome: { type: String, default: 'pending' },
    status: { type: String, enum: ['active', 'completed', 'failed'], default: 'completed' },
  },
  { timestamps: true }
);

export const Conversation = mongoose.model('Conversation', conversationSchema);