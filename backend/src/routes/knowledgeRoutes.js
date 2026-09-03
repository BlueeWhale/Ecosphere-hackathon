import express from 'express';
import {
  getKnowledgeDocs,
  getKnowledgeDoc,
  createKnowledgeDoc,
  updateKnowledgeDoc,
  deleteKnowledgeDoc,
} from '../controllers/knowledgeController.js';

const router = express.Router();

router.route('/').get(getKnowledgeDocs).post(createKnowledgeDoc);
router.route('/:id').get(getKnowledgeDoc).put(updateKnowledgeDoc).patch(updateKnowledgeDoc).delete(deleteKnowledgeDoc);

export default router;