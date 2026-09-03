import express from 'express';
import {
  getConversations,
  getConversation,
  createConversation,
  updateConversation,
  deleteConversation,
} from '../controllers/conversationController.js';

const router = express.Router();

router.route('/').get(getConversations).post(createConversation);
router.route('/:id').get(getConversation).put(updateConversation).patch(updateConversation).delete(deleteConversation);

export default router;