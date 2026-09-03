import express from 'express';
import {
  getCalendarAvailability,
  bookCalendarMeeting,
  escalateDealToHuman,
  takeoverDealByHuman,
} from '../controllers/calendarController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/availability', protect, getCalendarAvailability);
router.post('/book', protect, bookCalendarMeeting);
router.post('/escalate', protect, escalateDealToHuman);
router.post('/takeover', protect, takeoverDealByHuman);

export default router;
