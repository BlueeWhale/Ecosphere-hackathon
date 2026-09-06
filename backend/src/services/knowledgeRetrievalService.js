import { GoogleGenAI } from '@google/genai';
import { KnowledgeChunk } from '../models/KnowledgeChunk.js';
import { KnowledgeDocument } from '../models/KnowledgeDocument.js';

const EMBEDDING_DIMENSION = 768;

/**
 * Gets GoogleGenAI client if API key configured.
 */
function getGenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey.includes('your_gemini_api_key')) {
    return null;
  }
  return new GoogleGenAI({ apiKey, apiVersion: 'v1' });
}

/**
 * Fallback deterministic embedding generator (768 dimensions)
 * Used when Gemini API key is unconfigured or offline.
 */
function generateFallbackEmbedding(text) {
  const normalized = String(text || '').toLowerCase().replace(/[^\w\s]/g, ' ');
  const words = normalized.split(/\s+/).filter(Boolean);
  const vector = new Float32Array(EMBEDDING_DIMENSION);

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let hash = 0;
    for (let j = 0; j < word.length; j++) {
      hash = (hash << 5) - hash + word.charCodeAt(j);
      hash |= 0;
    }
    const idx = Math.abs(hash) % EMBEDDING_DIMENSION;
    vector[idx] += 1.0;
  }

  // Compute L2 norm for vector normalization
  let norm = 0;
  for (let i = 0; i < EMBEDDING_DIMENSION; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);

  if (norm > 0) {
    for (let i = 0; i < EMBEDDING_DIMENSION; i++) {
      vector[i] /= norm;
    }
  }

  return Array.from(vector);
}

/**
 * Generates text embedding using Google GenAI or local fallback.
 */
export async function generateEmbedding(text) {
  const client = getGenAIClient();
  const modelName = process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004';

  if (client) {
    try {
      const response = await client.models.embedContent({
        model: modelName,
        contents: text,
      });

      if (response.embedding?.values && Array.isArray(response.embedding.values)) {
        return response.embedding.values;
      }
    } catch (err) {
      console.warn(`[RAG Embedding Warning]: Gemini embedding failed (${err.message}). Using local fallback vector.`);
    }
  }

  return generateFallbackEmbedding(text);
}

/**
 * Computes Cosine Similarity between two numerical vectors.
 */
export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
  const len = Math.min(vecA.length, vecB.length);

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < len; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Splits document text into meaningful chunks (~300-500 characters with overlap).
 */
export function chunkText(text, maxChunkSize = 400, overlap = 80) {
  const str = String(text || '').trim();
  if (!str) return [];

  // Split by double newlines or paragraph breaks first
  const paragraphs = str.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  const chunks = [];

  let currentChunk = '';

  for (const para of paragraphs) {
    const cleanPara = para.trim();
    if (!currentChunk) {
      currentChunk = cleanPara;
    } else if (currentChunk.length + cleanPara.length + 1 <= maxChunkSize) {
      currentChunk += '\n\n' + cleanPara;
    } else {
      chunks.push(currentChunk);
      // Keep overlap from end of current chunk
      const overlapText = currentChunk.slice(-overlap);
      currentChunk = overlapText + '\n\n' + cleanPara;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

/**
 * Indexes or re-indexes a single document by chunking text, generating embeddings,
 * and persisting chunks to MongoDB.
 */
export async function indexDocument(doc) {
  if (!doc || !doc._id || !doc.content) return;

  const docId = doc._id;
  const docName = doc.title || doc.fileName || 'Untitled Document';
  const docType = doc.fileType || doc.source || 'General';

  // 1. Remove stale chunks
  await KnowledgeChunk.deleteMany({ documentId: docId });

  // 2. Extract chunks
  const rawChunks = chunkText(doc.content);
  if (rawChunks.length === 0) {
    await KnowledgeDocument.findByIdAndUpdate(docId, {
      chunkCount: 0,
      status: 'processed',
      lastIndexedAt: new Date(),
    });
    return;
  }

  // 3. Generate embeddings & construct KnowledgeChunk models
  const chunkDocs = [];
  for (let idx = 0; idx < rawChunks.length; idx++) {
    const text = rawChunks[idx];
    const embedding = await generateEmbedding(text);

    chunkDocs.push({
      documentId: docId,
      documentName: docName,
      documentType: docType,
      chunkIndex: idx,
      text,
      embedding,
      metadata: {
        source: doc.source || 'upload',
        fileName: doc.fileName || `${docName}.pdf`,
      },
    });
  }

  // 4. Save chunks
  await KnowledgeChunk.insertMany(chunkDocs);

  // 5. Update parent document status
  await KnowledgeDocument.findByIdAndUpdate(docId, {
    chunkCount: chunkDocs.length,
    status: 'processed',
    lastIndexedAt: new Date(),
  });

  console.log(`[RAG Indexing]: Successfully indexed document "${docName}" -> ${chunkDocs.length} chunks.`);
}

/**
 * Removes all associated chunks when a document is deleted.
 */
export async function removeDocumentChunks(docId) {
  if (!docId) return;
  await KnowledgeChunk.deleteMany({ documentId: docId });
}

/**
 * Performs Semantic Vector Retrieval against stored KnowledgeChunks in MongoDB.
 */
export async function retrieveKnowledge(query, options = {}) {
  const topK = options.topK || Number(process.env.RAG_TOP_K) || 5;
  const threshold = options.threshold ?? Number(process.env.RAG_SIMILARITY_THRESHOLD ?? 0.35);

  if (!query || typeof query !== 'string' || !query.trim()) {
    return [];
  }

  // 1. Generate query embedding
  const queryEmbedding = await generateEmbedding(query);

  // 2. Fetch all KnowledgeChunks from MongoDB
  const allChunks = await KnowledgeChunk.find().lean();
  if (!allChunks || allChunks.length === 0) {
    return [];
  }

  // 3. Score chunks using cosine similarity
  const scoredChunks = allChunks.map((chunk) => {
    const score = cosineSimilarity(queryEmbedding, chunk.embedding);
    return {
      documentId: chunk.documentId,
      documentName: chunk.documentName,
      documentType: chunk.documentType,
      chunkIndex: chunk.chunkIndex,
      text: chunk.text,
      score,
      metadata: chunk.metadata || {},
    };
  });

  // 4. Sort descending by similarity score
  scoredChunks.sort((a, b) => b.score - a.score);

  // 5. Filter by relevance threshold and limit to topK
  const relevantChunks = scoredChunks.filter((c) => c.score >= threshold).slice(0, topK);

  return relevantChunks;
}
