import { KnowledgeDocument } from '../models/KnowledgeDocument.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { indexDocument, removeDocumentChunks, retrieveKnowledge } from '../services/knowledgeRetrievalService.js';

export const getKnowledgeDocs = asyncHandler(async (req, res) => {
  const docs = await KnowledgeDocument.find().sort({ createdAt: -1 });
  res.status(200).json({
    success: true,
    data: docs,
  });
});

export const getKnowledgeDoc = asyncHandler(async (req, res) => {
  const doc = await KnowledgeDocument.findById(req.params.id);
  if (!doc) {
    res.status(404);
    throw new Error('Knowledge document not found');
  }
  res.status(200).json({
    success: true,
    data: doc,
  });
});

export const createKnowledgeDoc = asyncHandler(async (req, res) => {
  const doc = await KnowledgeDocument.create(req.body);
  await indexDocument(doc);
  const updatedDoc = await KnowledgeDocument.findById(doc._id);

  res.status(201).json({
    success: true,
    data: updatedDoc,
  });
});

export const updateKnowledgeDoc = asyncHandler(async (req, res) => {
  const doc = await KnowledgeDocument.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!doc) {
    res.status(404);
    throw new Error('Knowledge document not found');
  }

  await indexDocument(doc);
  const updatedDoc = await KnowledgeDocument.findById(doc._id);

  res.status(200).json({
    success: true,
    data: updatedDoc,
  });
});

export const deleteKnowledgeDoc = asyncHandler(async (req, res) => {
  const doc = await KnowledgeDocument.findById(req.params.id);
  if (!doc) {
    res.status(404);
    throw new Error('Knowledge document not found');
  }

  await removeDocumentChunks(doc._id);
  await doc.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Perform Semantic Vector Search on Knowledge Base
// @route   POST /api/knowledge/search
export const searchKnowledge = asyncHandler(async (req, res) => {
  const { query, topK, threshold } = req.body;

  if (!query || typeof query !== 'string' || !query.trim()) {
    res.status(400);
    throw new Error('Search query is required');
  }

  const results = await retrieveKnowledge(query, { topK, threshold });

  res.status(200).json({
    success: true,
    data: {
      query,
      count: results.length,
      results,
    },
  });
});