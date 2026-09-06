import mongoose from 'mongoose';

const followUpSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
    type: { type: String, required: true, default: 'email' },
    dueDate: { type: Date, required: true },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'pending' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export const FollowUp = mongoose.model('FollowUp', followUpSchema);