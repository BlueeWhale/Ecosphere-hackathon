import mongoose from 'mongoose';
import { Deal } from '../models/Deal.js';
import { VoiceSession } from '../models/VoiceSession.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { generateRtcToken, generateSessionTokens, validateAgoraConfig } from '../services/agoraTokenService.js';
import { startRemoteAgent, stopRemoteAgent } from '../services/agoraConversationalAiService.js';
import { processVoiceTurn } from '../services/voiceProcessingService.js';

// POST /api/voice/session
export const createVoiceSession = asyncHandler(async (req, res) => {
  const { dealId } = req.body;

  if (!dealId || !mongoose.Types.ObjectId.isValid(dealId)) {
    res.status(400);
    throw new Error('Valid dealId is required');
  }

  const deal = await Deal.findById(dealId);
  if (!deal) {
    res.status(404);
    throw new Error('Deal not found');
  }

  // Authorization / Ownership verification
  if (req.user.role !== 'admin' && deal.user && !deal.user.equals(req.user._id || req.user.id)) {
    res.status(403);
    throw new Error('Not authorized to start a voice session for this deal');
  }
  if (req.user.role !== 'admin' && deal.tenantId?.toString() !== req.user.tenantId?.toString()) {
    res.status(403);
    throw new Error('Not authorized to start a voice session for this company deal');
  }

  // Generate session and channel identifiers
  const sessionId = `vsession_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const channelName = `dealpilot_${dealId.toString().slice(-6)}_${Date.now()}`;
  const customerUid = Math.floor(100000 + Math.random() * 800000);
  const agentUid = 999999;

  // Generate short-lived RTC tokens for both Customer and AI Agent
  const sessionTokens = generateSessionTokens({
    channelName,
    customerUid,
    agentUid,
  });

  // Call Agora Conversational AI REST API v2 to start remote cloud agent worker (UID: 999999)
  const agentRemoteResult = await startRemoteAgent({
    channelName,
    customerUid,
    agentUid,
    agentToken: sessionTokens.agent.token,
    dealId: deal._id.toString(),
  });

  // Create VoiceSession record in MongoDB
  const session = new VoiceSession({
    deal: deal._id,
    user: req.user._id || req.user.id,
    tenantId: deal.tenantId || req.user.tenantId,
    agentSessionId: agentRemoteResult.agentSessionId || '',
    channelName,
    sessionId,
    agoraUid: customerUid,
    status: 'initiating',
    startedAt: new Date(),
    transcriptTurns: [],
  });

  await session.save();

  res.status(201).json({
    success: true,
    data: {
      sessionId,
      channelName,
      appId: sessionTokens.appId,
      token: sessionTokens.customer.token,
      uid: sessionTokens.customer.uid,
      customer: sessionTokens.customer,
      agent: {
        ...sessionTokens.agent,
        agentSessionId: agentRemoteResult.agentSessionId,
      },
      isMock: sessionTokens.isMock || agentRemoteResult.isMock,
      expiresInSeconds: sessionTokens.expiresInSeconds,
    },
  });
});

// POST /api/voice/agent-llm
// Webhook called by Agora Conversational AI Cloud Agent (or voice processor) to execute DealPilot Brain
export const handleAgentLlmWebhook = asyncHandler(async (req, res) => {
  const prompt =
    req.body.prompt ||
    req.body.transcript ||
    req.body.text ||
    (Array.isArray(req.body.messages) ? req.body.messages.slice(-1)[0]?.content : null);
  const dealId = req.body.dealId || req.query.dealId;
  const sessionId = req.body.sessionId || req.query.sessionId;

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(200).json({
      text: "Hello! I'm your DealPilot AI sales agent. How can I assist with your deployment scope or pricing today?",
      choices: [
        {
          message: {
            role: 'assistant',
            content: "Hello! I'm your DealPilot AI sales agent. How can I assist with your deployment scope or pricing today?",
          },
        },
      ],
    });
  }

  // Retrieve target deal
  let deal = null;
  if (dealId && mongoose.Types.ObjectId.isValid(dealId)) {
    deal = await Deal.findById(dealId);
  } else if (sessionId) {
    const session = await VoiceSession.findOne({ sessionId });
    if (session) deal = await Deal.findById(session.deal);
  }

  if (!deal) {
    const activeDeals = await Deal.find().sort({ updatedAt: -1 }).limit(1);
    deal = activeDeals[0];
  }

  if (!deal) {
    return res.status(200).json({
      text: "Thank you for reaching out to DealPilot. I'm ready to assist with your requirements.",
    });
  }

  const result = await processVoiceTurn({
    dealId: deal._id,
    userId: deal.user,
    userRole: 'user',
    sessionId,
    customerTranscript: prompt.trim(),
  });

  res.status(200).json({
    text: result.response,
    choices: [
      {
        message: {
          role: 'assistant',
          content: result.response,
        },
      },
    ],
    analysis: result.analysis,
    dealState: result.dealState,
    transcriptTurns: result.transcriptTurns,
  });
});

// POST /api/voice/process
export const processVoiceTranscript = asyncHandler(async (req, res) => {
  const { dealId, sessionId, transcript } = req.body;

  if (!dealId || !mongoose.Types.ObjectId.isValid(dealId)) {
    res.status(400);
    throw new Error('Valid dealId is required');
  }

  if (!transcript || typeof transcript !== 'string' || !transcript.trim()) {
    res.status(400);
    throw new Error('transcript is required and must be non-empty');
  }

  const deal = await Deal.findById(dealId);
  if (!deal) {
    res.status(404);
    throw new Error('Deal not found');
  }

  // Authorization check
  if (req.user.role !== 'admin' && deal.user && !deal.user.equals(req.user._id || req.user.id)) {
    res.status(403);
    throw new Error('Not authorized to process voice for this deal');
  }
  if (req.user.role !== 'admin' && deal.tenantId?.toString() !== req.user.tenantId?.toString()) {
    res.status(403);
    throw new Error('Not authorized to process voice for this company deal');
  }

  const result = await processVoiceTurn({
    dealId: deal._id,
    userId: req.user._id || req.user.id,
    userRole: req.user.role,
    sessionId,
    customerTranscript: transcript.trim(),
  });

  res.status(200).json({
    success: true,
    data: result,
  });
});

// POST /api/voice/end
export const endVoiceSession = asyncHandler(async (req, res) => {
  const { sessionId, duration, agentSessionId } = req.body;

  if (!sessionId) {
    res.status(400);
    throw new Error('sessionId is required');
  }

  const session = await VoiceSession.findOne({ sessionId });
  let updatedDealState = null;

  if (session) {
    session.status = 'completed';
    session.endedAt = new Date();
    if (typeof duration === 'number') {
      session.duration = Math.max(0, Math.round(duration));
    }
    await session.save();

    if (session.deal) {
      const deal = await Deal.findById(session.deal);
      if (deal) {
        const { calculateDealScore } = await import('../services/dealScoreService.js');
        const { determineNextBestAction } = await import('../services/nextBestActionService.js');
        const { formatDealState } = await import('../services/dealMemoryService.js');

        const scoreObj = calculateDealScore(deal);
        deal.dealScore = scoreObj.totalScore;
        deal.dealScoreBreakdown = scoreObj.breakdown;

        const nbaObj = determineNextBestAction(deal);
        deal.nextBestAction = nbaObj.action;
        deal.nextBestActionReason = nbaObj.reason;
        await deal.save();

        updatedDealState = formatDealState(deal);
      }
    }

    // Call Agora Conversational AI REST API v2 to stop remote cloud agent worker
    if (agentSessionId || session.agentSessionId) {
      await stopRemoteAgent({ agentSessionId: agentSessionId || session.agentSessionId });
    }
  }

  res.status(200).json({
    success: true,
    message: 'Voice session ended successfully',
    data: {
      session,
      dealState: updatedDealState,
    },
  });
});

// GET /api/voice/session/:sessionId
export const getVoiceSession = asyncHandler(async (req, res) => {
  const session = await VoiceSession.findOne({ sessionId: req.params.sessionId })
    .populate('deal', 'company customerName dealScore currentStage')
    .populate('user', 'name email');

  if (!session) {
    res.status(404);
    throw new Error('Voice session not found');
  }

  // Authorization check
  if (req.user.role !== 'admin' && session.user && !session.user._id.equals(req.user._id || req.user.id)) {
    res.status(403);
    throw new Error('Not authorized to view this voice session');
  }
  if (req.user.role !== 'admin' && session.tenantId?.toString() !== req.user.tenantId?.toString()) {
    res.status(403);
    throw new Error('Not authorized to view this company voice session');
  }

  res.status(200).json({
    success: true,
    data: session,
  });
});

// POST /api/voice/session/:sessionId/join-human
export const joinHumanVoiceSession = asyncHandler(async (req, res) => {
  const session = await VoiceSession.findOne({ sessionId: req.params.sessionId }).populate('deal');
  if (!session) {
    res.status(404);
    throw new Error('Voice session not found');
  }
  if (req.user.role !== 'admin' && session.tenantId?.toString() !== req.user.tenantId?.toString()) {
    res.status(403);
    throw new Error('Not authorized to join this voice session');
  }

  const humanUid = Number(req.user._id.toString().slice(-6), 16) % 800000 + 100000;
  const token = generateRtcToken({ channelName: session.channelName, uid: humanUid });
  if (session.agentSessionId) await stopRemoteAgent({ agentSessionId: session.agentSessionId });
  session.handoff = {
    ...(session.handoff?.toObject?.() || session.handoff || {}),
    status: 'CONNECTED',
    humanUser: req.user._id,
    connectedAt: new Date(),
  };
  await session.save();

  res.json({
    success: true,
    data: {
      channelName: session.channelName,
      appId: token.appId,
      token: token.token,
      uid: humanUid,
      contextPack: session.deal?.escalation?.contextPack || null,
      transcriptTurns: session.transcriptTurns,
    },
  });
});

// POST /api/voice/tts
export const synthesizeSpeech = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string' || !text.trim()) {
    res.status(400);
    throw new Error('text is required for speech synthesis');
  }

  const { synthesizeSpeechAudio } = await import('../services/ttsService.js');
  const { buffer, contentType, durationSeconds, isFallback } = await synthesizeSpeechAudio(text);

  res.set({
    'Content-Type': contentType,
    'Content-Length': buffer.length,
    'X-Duration-Seconds': durationSeconds || 0,
    'X-Is-Fallback': String(isFallback),
  });
  res.status(200).send(buffer);
});
