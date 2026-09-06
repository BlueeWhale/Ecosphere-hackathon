import express from 'express';
import {
  getKnowledgeDocs,
  getKnowledgeDoc,
  createKnowledgeDoc,
  updateKnowledgeDoc,
  deleteKnowledgeDoc,
  searchKnowledge,
} from '../controllers/knowledgeController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/search', protect, searchKnowledge);
router.route('/').get(protect, getKnowledgeDocs).post(protect, createKnowledgeDoc);
router
  .route('/:id')
  .get(protect, getKnowledgeDoc)
  .put(protect, updateKnowledgeDoc)
  .patch(protect, updateKnowledgeDoc)
  .delete(protect, deleteKnowledgeDoc);

export default router;