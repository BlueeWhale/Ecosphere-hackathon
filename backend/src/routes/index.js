import express from 'express';
import authRoutes from './authRoutes.js';
import leadRoutes from './leadRoutes.js';
import customerRoutes from './customerRoutes.js';
import conversationRoutes from './conversationRoutes.js';
import dealRoutes from './dealRoutes.js';
import productRoutes from './productRoutes.js';
import knowledgeRoutes from './knowledgeRoutes.js';
import followUpRoutes from './followUpRoutes.js';
import voiceRoutes from './voiceRoutes.js';
import calendarRoutes from './calendarRoutes.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Health Check Endpoint (Public)
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'DealPilot API is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// Mount Authentication Routes
router.use('/auth', authRoutes);

// Protected Resource Routes
router.use('/leads', protect, leadRoutes);
router.use('/customers', protect, customerRoutes);
router.use('/conversations', protect, conversationRoutes);
router.use('/deals', protect, dealRoutes);
router.use('/products', protect, productRoutes);
router.use('/knowledge', protect, knowledgeRoutes);
router.use('/follow-ups', protect, followUpRoutes);
router.use('/calendar', calendarRoutes);
router.use('/voice', voiceRoutes);

export default router;