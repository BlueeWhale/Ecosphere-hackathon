import express from 'express';
import { getLeads, getLead, createLead, updateLead, deleteLead } from '../controllers/leadController.js';

const router = express.Router();

router.route('/').get(getLeads).post(createLead);
router.route('/:id').get(getLead).put(updateLead).patch(updateLead).delete(deleteLead);

export default router;