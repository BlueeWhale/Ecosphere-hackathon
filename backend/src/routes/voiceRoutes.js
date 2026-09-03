import express from 'express';
import {
  createVoiceSession,
  processVoiceTranscript,
  endVoiceSession,
  getVoiceSession,
  synthesizeSpeech,
  handleAgentLlmWebhook,
} from '../controllers/voiceController.js';

import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public / Agora Cloud Agent Webhook Route
router.post('/agent-llm', handleAgentLlmWebhook);

// Protected Client Voice Endpoints
router.post('/session', protect, createVoiceSession);
router.post('/process', protect, processVoiceTranscript);
router.post('/tts', protect, synthesizeSpeech);
router.post('/end', protect, endVoiceSession);
router.get('/session/:sessionId', protect, getVoiceSession);

export default router;
