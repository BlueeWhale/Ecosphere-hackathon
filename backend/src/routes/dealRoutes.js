import express from 'express';
import {
  getDeals,
  getDeal,
  createDeal,
  updateDeal,
  deleteDeal,
} from '../controllers/dealController.js';

const router = express.Router();

router.route('/').get(getDeals).post(createDeal);
router.route('/:id').get(getDeal).put(updateDeal).patch(updateDeal).delete(deleteDeal);

export default router;