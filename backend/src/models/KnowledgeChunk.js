import mongoose from 'mongoose';

const knowledgeChunkSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'KnowledgeDocument',
      required: true,
      index: true,
    },
    documentName: { type: String, required: true },
    documentType: { type: String, default: 'General' },
    chunkIndex: { type: Number, required: true },
    text: { type: String, required: true },
    embedding: { type: [Number], default: [] },
    metadata: { type: Object, default: {} },
  },
  { timestamps: true }
);

// Compound index for quick chunk lookup by document & order
knowledgeChunkSchema.index({ documentId: 1, chunkIndex: 1 });

export const KnowledgeChunk = mongoose.model('KnowledgeChunk', knowledgeChunkSchema);
