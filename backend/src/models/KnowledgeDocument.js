import mongoose from 'mongoose';

const knowledgeDocumentSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Document title is required'], trim: true },
    fileName: { type: String, required: true },
    fileType: { type: String, required: true },
    content: { type: String, default: '' },
    source: { type: String, default: 'upload' },
    status: {
      type: String,
      enum: ['pending', 'processing', 'processed', 'failed'],
      default: 'pending',
    },
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const KnowledgeDocument = mongoose.model('KnowledgeDocument', knowledgeDocumentSchema);