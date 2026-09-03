import express from 'express';
import {
  getDeals,
  getDeal,
  createDeal,
  updateDeal,
  deleteDeal,
  getDealState,
  updateDealState,
  generateDealQuote,
  analyzeMessageForDeal,
  respondToCustomer,
} from '../controllers/dealController.js';
import { validateDealStateUpdate } from '../middleware/dealStateValidator.js';
import { validatePricingQuote } from '../middleware/pricingValidator.js';

const router = express.Router();

// AI Strategist Routes
router.route('/:id/ai/analyze').post(analyzeMessageForDeal);
router.route('/:id/ai/respond').post(respondToCustomer);

// Pricing Quote Route
router
  .route('/:id/pricing/quote')
  .post(validatePricingQuote, generateDealQuote);

// State & Memory Routes
router
  .route('/:id/state')
  .get(getDealState)
  .patch(validateDealStateUpdate, updateDealState);

// Standard CRUD Routes
router.route('/').get(getDeals).post(createDeal);
router.route('/:id').get(getDeal).put(updateDeal).patch(updateDeal).delete(deleteDeal);

export default router;