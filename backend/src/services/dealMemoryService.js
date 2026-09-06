import mongoose from 'mongoose';
import { Deal } from '../models/Deal.js';
import {
  STAGE_LIST,
  BUYING_INTENT_LIST,
  OBJECTION_TYPE_LIST,
  OBJECTION_STATUS_LIST,
  DEAL_STAGES,
  BUYING_INTENT,
} from '../constants/dealConstants.js';
import { calculateDealScore } from './dealScoreService.js';
import { determineNextBestAction } from './nextBestActionService.js';

/**
 * Formats a Deal Mongoose document into the standard Deal State representation.
 */
export function formatDealState(deal) {
  return {
    dealId: deal._id,
    company: deal.company,
    customer: {
      name: deal.customerName || '',
      role: deal.customerRole || '',
      email: deal.customerEmail || '',
      phone: deal.customerPhone || '',
      decisionMaker: !!deal.decisionMaker,
      decisionMakerName: deal.decisionMakerName || '',
    },
    currentStage: deal.currentStage || DEAL_STAGES.NEW,
    dealScore: deal.dealScore ?? 10,
    dealScoreBreakdown: deal.dealScoreBreakdown || {},
    buyingIntent: deal.buyingIntent || BUYING_INTENT.UNKNOWN,
    requirements: {
      numberOfUsers: deal.numberOfUsers || 1,
      product: deal.product || deal.productInterest || '',
      requiredFeatures: deal.requiredFeatures || [],
      timeline: deal.timeline || '',
      budget: deal.budget || '',
      summary: deal.requirements || '',
    },
    competitors: deal.competitors || [],
    objections: deal.objectionsList || [],
    conversationContext: {
      preferences: deal.customerPreferences || [],
      painPoints: deal.painPoints || [],
      importantFacts: deal.importantFacts || [],
      sentiment: deal.sentiment || 'neutral',
    },
    adaptiveContext: deal.adaptiveContext || {},
    pricingContext: deal.pricingContext || {},
    nextBestAction: deal.nextBestAction || '',
    status: deal.status || 'open',
    lastUpdated: deal.lastMemoryUpdate || deal.updatedAt,
  };
}

/**
 * Retrieves the structured Deal State for a given dealId, enforcing user authorization.
 */
export async function getDealState(dealId, userId, userRole) {
  if (!mongoose.Types.ObjectId.isValid(dealId)) {
    const error = new Error('Invalid deal ID format');
    error.statusCode = 400;
    throw error;
  }

  const deal = await Deal.findById(dealId);
  if (!deal) {
    const error = new Error('Deal not found');
    error.statusCode = 404;
    throw error;
  }

  // Check ownership
  if (userRole !== 'admin' && deal.user && !deal.user.equals(userId)) {
    const error = new Error('Not authorized to access this deal');
    error.statusCode = 403;
    throw error;
  }

  // If deal had no user set yet, associate with current user
  if (!deal.user && userId) {
    deal.user = userId;
    await deal.save();
  }

  return formatDealState(deal);
}

/**
 * Deep merges updates into the Deal Memory and persists to MongoDB.
 */
export async function updateDealMemory(dealId, updates = {}, userId, userRole) {
  if (!mongoose.Types.ObjectId.isValid(dealId)) {
    const error = new Error('Invalid deal ID format');
    error.statusCode = 400;
    throw error;
  }

  const deal = await Deal.findById(dealId);
  if (!deal) {
    const error = new Error('Deal not found');
    error.statusCode = 404;
    throw error;
  }

  // Authorization check
  if (userRole !== 'admin' && deal.user && !deal.user.equals(userId)) {
    const error = new Error('Not authorized to update this deal');
    error.statusCode = 403;
    throw error;
  }

  if (!deal.user && userId) {
    deal.user = userId;
  }

  // 1. Merge Customer / Account Info
  if (updates.customer && typeof updates.customer === 'object') {
    if (typeof updates.customer.name === 'string') deal.customerName = updates.customer.name.trim();
    if (typeof updates.customer.role === 'string') deal.customerRole = updates.customer.role.trim();
    if (typeof updates.customer.email === 'string') deal.customerEmail = updates.customer.email.toLowerCase().trim();
    if (typeof updates.customer.phone === 'string') deal.customerPhone = updates.customer.phone.trim();
    if (typeof updates.customer.company === 'string' && updates.customer.company.trim()) {
      deal.company = updates.customer.company.trim();
    }
    if (typeof updates.customer.decisionMaker === 'boolean') {
      deal.decisionMaker = updates.customer.decisionMaker;
    }
    if (typeof updates.customer.decisionMakerName === 'string') {
      deal.decisionMakerName = updates.customer.decisionMakerName.trim();
    }
  }
  if (typeof updates.customerName === 'string') deal.customerName = updates.customerName.trim();
  if (typeof updates.customerRole === 'string') deal.customerRole = updates.customerRole.trim();
  if (typeof updates.customerEmail === 'string') deal.customerEmail = updates.customerEmail.toLowerCase().trim();
  if (typeof updates.customerPhone === 'string') deal.customerPhone = updates.customerPhone.trim();
  if (typeof updates.company === 'string' && updates.company.trim()) deal.company = updates.company.trim();
  if (typeof updates.decisionMaker === 'boolean') deal.decisionMaker = updates.decisionMaker;
  if (typeof updates.decisionMakerName === 'string') deal.decisionMakerName = updates.decisionMakerName.trim();

  // 2. Merge Requirements
  const reqObj = updates.requirements && typeof updates.requirements === 'object' ? updates.requirements : null;
  if (reqObj) {
    if (reqObj.numberOfUsers !== undefined && reqObj.numberOfUsers !== null) {
      const parsedUsers = Number(reqObj.numberOfUsers);
      if (!Number.isInteger(parsedUsers) || parsedUsers < 1) {
        const error = new Error('numberOfUsers must be a positive integer >= 1');
        error.statusCode = 400;
        throw error;
      }
      deal.numberOfUsers = parsedUsers;
    }
    if (typeof reqObj.product === 'string') {
      deal.product = reqObj.product.trim();
      deal.productInterest = reqObj.product.trim();
    }
    if (Array.isArray(reqObj.requiredFeatures)) {
      const existing = deal.requiredFeatures || [];
      const cleanNew = reqObj.requiredFeatures.map((f) => String(f).trim()).filter(Boolean);
      deal.requiredFeatures = Array.from(new Set([...existing, ...cleanNew]));
    }
    if (typeof reqObj.timeline === 'string') deal.timeline = reqObj.timeline.trim();
    if (typeof reqObj.budget === 'string') deal.budget = reqObj.budget.trim();
    if (typeof reqObj.summary === 'string') deal.requirements = reqObj.summary.trim();
  }

  // Also support direct top-level requirements fields
  if (updates.numberOfUsers !== undefined && updates.numberOfUsers !== null) {
    const parsedUsers = Number(updates.numberOfUsers);
    if (!Number.isInteger(parsedUsers) || parsedUsers < 1) {
      const error = new Error('numberOfUsers must be a positive integer >= 1');
      error.statusCode = 400;
      throw error;
    }
    deal.numberOfUsers = parsedUsers;
  }
  if (typeof updates.budget === 'string') deal.budget = updates.budget.trim();
  if (typeof updates.product === 'string') {
    deal.product = updates.product.trim();
    deal.productInterest = updates.product.trim();
  }
  if (typeof updates.timeline === 'string') deal.timeline = updates.timeline.trim();

  // 3. Merge Competitors
  if (Array.isArray(updates.competitors)) {
    const existingComps = deal.competitors || [];
    const newComps = updates.competitors.map((c) => String(c).trim()).filter(Boolean);
    deal.competitors = Array.from(new Set([...existingComps, ...newComps]));
    deal.competitor = deal.competitors.join(', ');
  }

  // 4. Merge Objections
  if (Array.isArray(updates.objections)) {
    deal.objectionsList = deal.objectionsList || [];
    for (const obj of updates.objections) {
      if (!obj || typeof obj !== 'object' || !obj.text || !obj.text.trim()) {
        const error = new Error('Each objection must be an object with non-empty "text"');
        error.statusCode = 400;
        throw error;
      }
      const cleanText = obj.text.trim();
      const rawType = (obj.type || 'OTHER').toUpperCase();
      const validEnum = OBJECTION_TYPE_LIST.includes(rawType) ? rawType : 'OTHER';
      const rawStatus = (obj.status || 'UNRESOLVED').toUpperCase();
      const validStatus = OBJECTION_STATUS_LIST.includes(rawStatus) ? rawStatus : 'UNRESOLVED';

      // Look for existing objection with same text or id
      const existingIdx = deal.objectionsList.findIndex(
        (existing) => (obj.id && existing.id === obj.id) || existing.text.toLowerCase() === cleanText.toLowerCase()
      );

      if (existingIdx >= 0) {
        deal.objectionsList[existingIdx].status = validStatus;
        if (obj.resolutionNotes !== undefined) {
          deal.objectionsList[existingIdx].resolutionNotes = String(obj.resolutionNotes);
        }
        if (obj.type) deal.objectionsList[existingIdx].type = validEnum;
      } else {
        deal.objectionsList.push({
          id: obj.id || new mongoose.Types.ObjectId().toString(),
          type: validEnum,
          text: cleanText,
          status: validStatus,
          resolutionNotes: obj.resolutionNotes || '',
          detectedAt: obj.detectedAt || new Date(),
        });
      }
    }
    deal.objections = deal.objectionsList.map((o) => `${o.type}: ${o.text} (${o.status})`).join('; ');
  }

  // 5. Merge Buying Intent
  const rawIntent = updates.buyingIntent || updates.intent;
  if (rawIntent) {
    const cleanIntent = String(rawIntent).toUpperCase();
    if (!BUYING_INTENT_LIST.includes(cleanIntent)) {
      const error = new Error(`Invalid buyingIntent. Allowed values: ${BUYING_INTENT_LIST.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }
    deal.buyingIntent = cleanIntent;
    deal.intent = cleanIntent.toLowerCase();
  }

  // 6. Merge Stage
  const rawStage = updates.currentStage || updates.decisionStage || updates.dealStage || updates.stage;
  if (rawStage) {
    const cleanStage = String(rawStage).toUpperCase();
    if (!STAGE_LIST.includes(cleanStage)) {
      const error = new Error(`Invalid deal stage. Allowed values: ${STAGE_LIST.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }
    deal.currentStage = cleanStage;
    deal.dealStage = cleanStage.toLowerCase();
  }

  // 7. Conversational Context arrays
  if (Array.isArray(updates.customerPreferences)) {
    const existing = deal.customerPreferences || [];
    const clean = updates.customerPreferences.map((p) => String(p).trim()).filter(Boolean);
    deal.customerPreferences = Array.from(new Set([...existing, ...clean]));
  }
  if (Array.isArray(updates.painPoints)) {
    const existing = deal.painPoints || [];
    const clean = updates.painPoints.map((p) => String(p).trim()).filter(Boolean);
    deal.painPoints = Array.from(new Set([...existing, ...clean]));
  }
  if (Array.isArray(updates.importantFacts)) {
    const existing = deal.importantFacts || [];
    const clean = updates.importantFacts.map((f) => String(f).trim()).filter(Boolean);
    deal.importantFacts = Array.from(new Set([...existing, ...clean]));
  }
  if (updates.sentiment && ['positive', 'neutral', 'negative'].includes(updates.sentiment)) {
    deal.sentiment = updates.sentiment;
  }

  if (updates.adaptiveContext && typeof updates.adaptiveContext === 'object') {
    deal.adaptiveContext = {
      ...(deal.adaptiveContext || {}),
      ...updates.adaptiveContext,
    };
  }

  // 8. Pricing Context
  if (updates.pricingContext && typeof updates.pricingContext === 'object') {
    deal.pricingContext = {
      ...deal.pricingContext?.toObject?.() || deal.pricingContext || {},
      ...updates.pricingContext,
    };
  }

  // 9. Recalculate Deterministic Deal Score & Breakdown
  const scoreResult = calculateDealScore(deal);
  deal.dealScore = scoreResult.score;
  deal.dealScoreBreakdown = scoreResult.breakdown;

  // 10. Update Next Best Action
  if (typeof updates.nextBestAction === 'string' && updates.nextBestAction.trim()) {
    deal.nextBestAction = updates.nextBestAction.trim();
  } else {
    deal.nextBestAction = determineNextBestAction(deal);
  }

  await deal.save();

  const dealState = formatDealState(deal);

  try {
    const { emitDealUpdate } = await import('./socketService.js');
    emitDealUpdate(deal._id.toString(), dealState);
  } catch (_) {}

  return dealState;
}
