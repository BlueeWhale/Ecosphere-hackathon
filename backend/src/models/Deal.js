import mongoose from 'mongoose';
import {
  STAGE_LIST,
  BUYING_INTENT_LIST,
  OBJECTION_TYPE_LIST,
  OBJECTION_STATUS_LIST,
} from '../constants/dealConstants.js';

const objectionItemSchema = new mongoose.Schema(
  {
    id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    type: {
      type: String,
      enum: OBJECTION_TYPE_LIST,
      default: 'OTHER',
    },
    text: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: OBJECTION_STATUS_LIST,
      default: 'UNRESOLVED',
    },
    resolutionNotes: { type: String, default: '' },
    detectedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const pricingContextSchema = new mongoose.Schema(
  {
    quotedAmount: { type: Number, default: 0 },
    baseAmount: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    offeredDiscountPct: { type: Number, default: 0, min: 0, max: 100 },
    volumeDiscountPct: { type: Number, default: 0, min: 0, max: 100 },
    requestedDiscountPct: { type: Number, default: 0, min: 0, max: 100 },
    approvedDiscountPct: { type: Number, default: 0, min: 0, max: 100 },
    userCount: { type: Number, default: 1 },
    planTier: { type: String, default: '' },
    billingCycle: {
      type: String,
      enum: ['monthly', 'annual', 'multi_year', 'multi-year', 'unknown'],
      default: 'unknown',
    },
    policyStatus: {
      type: String,
      enum: ['APPROVED', 'REQUIRES_APPROVAL', 'REJECTED', 'PENDING'],
      default: 'PENDING',
    },
    policyReason: { type: String, default: '' },
    specialTerms: { type: String, default: '' },
    quotedAt: { type: Date },
  },
  { _id: false }
);

const scoreBreakdownSchema = new mongoose.Schema(
  {
    base: { type: Number, default: 10 },
    intent: { type: Number, default: 0 },
    requirements: { type: Number, default: 0 },
    budget: { type: Number, default: 0 },
    authority: { type: Number, default: 0 },
    timeline: { type: Number, default: 0 },
    objectionPenalty: { type: Number, default: 0 },
  },
  { _id: false }
);

const dealSchema = new mongoose.Schema(
  {
    // Ownership
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },

    // Associations
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },

    // Core Account Info
    company: { type: String, required: [true, 'Company name is required'], trim: true },
    customerName: { type: String, trim: true, default: '' },
    customerRole: { type: String, trim: true, default: '' },
    customerEmail: { type: String, trim: true, lowercase: true, default: '' },
    customerPhone: { type: String, trim: true, default: '' },

    // Requirements & Scope
    requirements: { type: String, default: '' }, // legacy text summary
    product: { type: String, trim: true, default: '' },
    productInterest: { type: String, default: '' }, // legacy field kept in sync
    numberOfUsers: { type: Number, default: 1, min: 1 },
    requiredFeatures: [{ type: String, trim: true }],
    timeline: { type: String, trim: true, default: '' },
    budget: { type: String, default: '' },

    // Buying Context & Authority
    decisionMaker: { type: Boolean, default: false },
    decisionMakerName: { type: String, trim: true, default: '' },
    buyingIntent: {
      type: String,
      enum: BUYING_INTENT_LIST,
      default: 'UNKNOWN',
    },
    intent: { type: String, default: 'unknown' }, // legacy field

    // Stage Tracking
    currentStage: {
      type: String,
      enum: STAGE_LIST,
      default: 'NEW',
    },
    dealStage: { type: String, default: 'discovery' }, // legacy field

    // Competitors & Objections
    competitors: [{ type: String, trim: true }],
    competitor: { type: String, default: '' }, // legacy field
    objectionsList: [objectionItemSchema],
    objections: { type: String, default: '' }, // legacy field

    // Conversational Context
    customerPreferences: [{ type: String, trim: true }],
    painPoints: [{ type: String, trim: true }],
    importantFacts: [{ type: String, trim: true }],
    sentiment: { type: String, enum: ['positive', 'neutral', 'negative'], default: 'neutral' },

    // Pricing Context
    pricingContext: {
      type: pricingContextSchema,
      default: () => ({}),
    },

    // Deal Score & Actions
    dealScore: { type: Number, min: 0, max: 100, default: 10 },
    dealScoreBreakdown: {
      type: scoreBreakdownSchema,
      default: () => ({}),
    },
    nextBestAction: {
      type: String,
      default: 'Initiate discovery to qualify customer requirements and budget',
    },

    // Calendar Booking & Escalation
    calendarBooking: {
      type: new mongoose.Schema(
        {
          eventId: { type: String, default: '' },
          status: { type: String, enum: ['NONE', 'SLOTS_OFFERED', 'CONFIRMED', 'CANCELLED', 'FAILED'], default: 'NONE' },
          meetingDate: { type: String, default: '' },
          meetingTime: { type: String, default: '' },
          durationMinutes: { type: Number, default: 30 },
          attendeeEmail: { type: String, default: '' },
          summary: { type: String, default: '' },
          googleCalendarLink: { type: String, default: '' },
          bookedAt: { type: Date },
        },
        { _id: false }
      ),
      default: () => ({}),
    },
    escalation: {
      type: new mongoose.Schema(
        {
          status: { type: String, enum: ['NONE', 'ESCALATION_REQUESTED', 'HUMAN_CONNECTED', 'RESOLVED'], default: 'NONE' },
          reason: { type: String, default: '' },
          triggeredBy: { type: String, default: '' },
          escalatedAt: { type: Date },
          contextPack: { type: mongoose.Schema.Types.Mixed },
        },
        { _id: false }
      ),
      default: () => ({}),
    },

    // Status & Timestamps
    status: { type: String, enum: ['open', 'won', 'lost'], default: 'open' },
    lastMemoryUpdate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Deal = mongoose.model('Deal', dealSchema);