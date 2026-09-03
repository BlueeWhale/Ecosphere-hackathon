import mongoose from 'mongoose';

const voiceSessionSchema = new mongoose.Schema(
  {
    deal: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    channelName: { type: String, required: true, unique: true },
    sessionId: { type: String, required: true, unique: true, index: true },
    agoraUid: { type: Number, required: true },
    status: {
      type: String,
      enum: ['initiating', 'active', 'completed', 'failed'],
      default: 'initiating',
    },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
    duration: { type: Number, default: 0 },
    transcriptTurns: [
      {
        speaker: { type: String, enum: ['customer', 'agent', 'system'], required: true },
        text: { type: String, required: true },
        intent: { type: String },
        detectedObjections: [{ type: String }],
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export const VoiceSession = mongoose.model('VoiceSession', voiceSessionSchema);
