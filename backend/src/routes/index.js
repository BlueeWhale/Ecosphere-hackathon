import express from 'express';
import authRoutes from './authRoutes.js';
import leadRoutes from './leadRoutes.js';
import customerRoutes from './customerRoutes.js';
import conversationRoutes from './conversationRoutes.js';
import dealRoutes from './dealRoutes.js';
import productRoutes from './productRoutes.js';
import knowledgeRoutes from './knowledgeRoutes.js';
import followUpRoutes from './followUpRoutes.js';

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

// Resource Routes
router.use('/leads', leadRoutes);
router.use('/customers', customerRoutes);
router.use('/conversations', conversationRoutes);
router.use('/deals', dealRoutes);
router.use('/products', productRoutes);
router.use('/knowledge', knowledgeRoutes);
router.use('/follow-ups', followUpRoutes);

export default router;