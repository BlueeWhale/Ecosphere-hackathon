import express from 'express';
import {
  getFollowUps,
  getFollowUp,
  createFollowUp,
  updateFollowUp,
  deleteFollowUp,
} from '../controllers/followUpController.js';

const router = express.Router();

router.route('/').get(getFollowUps).post(createFollowUp);
router.route('/:id').get(getFollowUp).put(updateFollowUp).patch(updateFollowUp).delete(deleteFollowUp);

export default router;