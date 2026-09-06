import mongoose from 'mongoose';

const knowledgeDocumentSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Document title is required'], trim: true },
    fileName: { type: String, required: true },
    fileType: { type: String, required: true },
    content: { type: String, default: '' },
    source: { type: String, default: 'upload' },
    chunkCount: { type: Number, default: 0 },
    lastIndexedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ['pending', 'processing', 'processed', 'failed'],
      default: 'pending',
    },
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const KnowledgeDocument = mongoose.model('KnowledgeDocument', knowledgeDocumentSchema);

/**
 * Ensures the Knowledge Base in MongoDB is populated with official DealPilot demo documents
 * and that all documents are indexed into vector RAG chunks.
 */
export async function seedDefaultKnowledgeDocs() {
  const count = await KnowledgeDocument.countDocuments();

  if (count === 0) {
    const defaultDocs = [
      {
        title: 'Enterprise Pricing Guidelines 2026',
        fileName: 'Enterprise_Pricing_Guidelines_2026.pdf',
        fileType: 'PDF Specification',
        status: 'processed',
        source: 'system',
        content: `DEALPILOT ENTERPRISE PRICING GUIDELINES 2026

1. PRODUCT TIERS & SEAT RATES:
- Starter Plan: $49/user/month ($39/user/month billed annually). Minimum 1 seat, maximum 10 seats. Features include standard AI qualification, basic CRM sync, and email follow-ups.
- Growth Plan: $99/user/month ($79/user/month billed annually). Minimum 11 seats, maximum 50 seats. Features include adaptive AI negotiation, RAG knowledge integration, and Google Calendar booking.
- Enterprise Suite: $199/user/month ($159/user/month billed annually). Minimum 51 seats, up to 10,000 seats. Features include real-time voice RTC, custom negotiation rules, and human agent escalation.

2. VOLUME DISCOUNTS & CONCESSION RULES:
- Tiered Volume Discounts: 11-50 users: 5% discount; 51-200 users: 15% discount; 201+ users: 20% discount.
- Maximum Concession Ceiling: Hard limit cap of 25% discount across all plans.
- Policy Approval Requirements: Any discount request exceeding standard tier limits up to 25% is automatically flagged. Any request above 25% requires VP Sales manual approval (policyStatus = REQUIRES_APPROVAL).`,
      },
      {
        title: 'Competitor Comparison Matrix',
        fileName: 'Competitor_Comparison_Matrix.docx',
        fileType: 'Battlecard',
        status: 'processed',
        source: 'system',
        content: `DEALPILOT COMPETITOR BATTLECARD & COMPARISON MATRIX

1. DEALPILOT vs SALESFORCE vs HUBSPOT:
- AI Sales Conversations: DealPilot provides real-time voice RTC calls powered by Agora and Gemini 2.5 Flash. Salesforce and HubSpot rely on text-only chat assistants or third-party add-ons.
- Real-Time Negotiation Guardrails: DealPilot enforces deterministic pricing rules with a 25% maximum discount cap and automatic VP approval routing. Salesforce requires complex CPQ workflows.
- Persistent Deal Memory: DealPilot maintains a structured source-of-truth state for requirements (e.g. 50 -> 200 users), competitor tags, and objections after every voice turn.
- Next Best Action & Scoring: DealPilot computes a 0-100 rubric deal score and actionable next-best-action guidance in real time.`,
      },
      {
        title: 'Security & SLA Compliance FAQ',
        fileName: 'Security_SLA_Compliance_FAQ.pdf',
        fileType: 'Compliance',
        status: 'processed',
        source: 'system',
        content: `DEALPILOT ENTERPRISE SECURITY & SLA COMPLIANCE FAQ

1. DATA HANDLING & PRIVACY:
- All communications are encrypted in transit via TLS 1.3 and at rest using AES-256. Customer conversation transcripts and deal state memory are isolated per enterprise tenant.

2. AUTHENTICATION & ACCESS CONTROL:
- Enterprise sessions use JWT token authorization with role-based access control (RBAC). For hackathon demonstrations, a configurable DEMO_MODE toggle allows seamless evaluation.

3. AUDITABILITY & GOVERNANCE:
- All pricing concessions, policy status changes (APPROVED vs REQUIRES_APPROVAL), and human escalation events are immutably logged with timestamps and user IDs.

4. AVAILABILITY & SLA:
- DealPilot guarantees 99.9% platform availability for real-time Agora voice streams and backend intelligence services.

5. HUMAN ESCALATION PROTOCOL:
- Automated routing to human sales representatives occurs when concession limits are exceeded or explicit human assistance is requested.`,
      },
      {
        title: 'DealPilot Product Overview',
        fileName: 'DealPilot_Product_Overview.pdf',
        fileType: 'Product Specification',
        status: 'processed',
        source: 'system',
        content: `DEALPILOT PLATFORM PRODUCT OVERVIEW

1. CORE CAPABILITIES:
- DealPilot converts text and voice conversations into dynamic sales intelligence and automated commercial actions.
- Real-Time Voice Agent: Agora Cloud Conversational AI REST Engine v2 + Microsoft Neural TTS.
- Gemini 2.5 Flash Strategist: Analyzes customer intent, extracts user seat scope (e.g. 50 -> 200 users), identifies competitors (e.g. Salesforce), and records commercial objections.
- Deal Memory & Rubric Scoring: Maintains source-of-truth state, calculates a 0-100 rubric deal score across 6 weighted categories, and recommends Next Best Actions.
- Pricing Guard & Action Router: Enforces discount ceilings (25% max) and automates Google Calendar demo booking.`,
      },
      {
        title: 'DealPilot Sales FAQ',
        fileName: 'DealPilot_Sales_FAQ.docx',
        fileType: 'FAQ',
        status: 'processed',
        source: 'system',
        content: `DEALPILOT FREQUENTLY ASKED SALES QUESTIONS

Q1: What is DealPilot?
A: DealPilot is an adaptive AI sales agent that conducts real-time voice qualification calls, enforces pricing negotiation guardrails, and books product demos automatically.

Q2: How does the voice agent work?
A: Customer speaks into browser microphone -> Agora RTC -> STT -> Gemini 2.5 Flash -> Deal Memory / Pricing Engine -> Response -> Agora RTC -> Customer speaker.

Q3: How does DealPilot remember customer requirements?
A: Extracted parameters (user count, budget, features) are merged into MongoDB Deal Memory after every voice turn.

Q4: How does pricing negotiation work?
A: Backend Pricing Engine evaluates quotes against official catalog tiers. Discounts are capped at 25%, and requests >25% trigger approval routing.

Q5: Can it handle competitors and schedule demos?
A: Yes, identifies competitor mentions (e.g. Salesforce) and schedules confirmed Google Calendar appointments.`,
      },
    ];

    await KnowledgeDocument.insertMany(defaultDocs);
    console.log('[Knowledge Base Seeded]: 5 official DealPilot knowledge documents initialized in MongoDB.');
  }

  // Ensure all documents in MongoDB are indexed into RAG vector chunks
  try {
    const { indexDocument } = await import('../services/knowledgeRetrievalService.js');
    const docsToIndex = await KnowledgeDocument.find({
      $or: [{ chunkCount: 0 }, { chunkCount: { $exists: false } }],
    });

    for (const doc of docsToIndex) {
      await indexDocument(doc);
    }
  } catch (err) {
    console.warn('[Knowledge Base RAG Indexing Warning]: Could not complete initial chunk indexing:', err.message);
  }
}