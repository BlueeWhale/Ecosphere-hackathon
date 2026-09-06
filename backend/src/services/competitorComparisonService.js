import { PRICING_TIERS } from '../constants/pricingConfig.js';
import { retrieveKnowledge } from './knowledgeRetrievalService.js';
import { getConfiguredQuote, resolvePlanTier } from './adaptiveConversationService.js';

const UNKNOWN = 'Not verified in configured sources';

function sourceText(chunks) {
  return chunks.map((chunk) => chunk.text || '').join('\n').toLowerCase();
}

function verifiedValue(text, patterns, value) {
  return patterns.some((pattern) => pattern.test(text)) ? value : UNKNOWN;
}

function recommendation({ priority, dealPrice, competitorPrice, users }) {
  if (competitorPrice !== null && competitorPrice < dealPrice && priority === 'pricing') {
    return {
      option: 'COMPETITOR',
      reason: `The verified competitor price is lower for the current ${users}-user requirement and pricing is the stated priority. Validate feature and implementation differences before choosing.`,
    };
  }
  return {
    option: 'DEALPILOT',
    reason: priority === 'implementation'
      ? 'DealPilot is the better fit when implementation support and adaptive conversation memory are the priority.'
      : 'DealPilot is the better fit when adaptive sales conversations, negotiation guardrails, and conversation memory matter for the current requirement.',
  };
}

export async function buildCompetitorComparison(deal, competitorName = deal?.competitors?.[0]) {
  if (!competitorName) return null;

  const users = Number(deal.numberOfUsers) || 1;
  const tier = resolvePlanTier(deal, users);
  const quote = getConfiguredQuote(deal, users, 0, deal.adaptiveContext?.commitmentMonths || null);
  const chunks = await retrieveKnowledge(
    `${competitorName} pricing features integrations implementation support comparison`,
    { topK: 8, threshold: 0.25 }
  );
  const text = sourceText(chunks);
  const isSalesforce = /salesforce/i.test(competitorName);
  const competitorPriceMatch = text.match(/(?:salesforce|competitor)[^\n$₹]{0,80}(?:\$|₹)\s*([\d,]+)/i);
  const competitorPrice = competitorPriceMatch ? Number(competitorPriceMatch[1].replace(/,/g, '')) : null;
  const competitorLabel = isSalesforce ? 'Salesforce' : competitorName;

  const competitor = {
    name: competitorLabel,
    price: competitorPrice === null ? UNKNOWN : competitorPrice,
    priceCurrency: competitorPrice === null ? null : quote.currency,
    users,
    aiSalesAgent: verifiedValue(text, [/salesforce.*(?:chat|assistant|ai)/i], 'Not verified'),
    crmCapabilities: verifiedValue(text, [/salesforce.*crm|crm.*salesforce/i], 'CRM capabilities mentioned in source'),
    adaptiveAi: verifiedValue(text, [/salesforce.*fixed|third-party|adaptive/i], 'Not verified'),
    conversationMemory: verifiedValue(text, [/salesforce.*memory|persistent deal memory/i], 'Not verified'),
    negotiationAi: verifiedValue(text, [/salesforce.*cpq|negotiation/i], 'Not verified'),
    humanHandoff: UNKNOWN,
    integrations: verifiedValue(text, [/salesforce.*integration|integration.*salesforce/i], 'Integrations mentioned in source'),
    implementation: verifiedValue(text, [/salesforce.*implementation|implementation.*salesforce/i], 'Not verified'),
    support: verifiedValue(text, [/salesforce.*support|support.*salesforce/i], 'Not verified'),
    sources: chunks.map((chunk) => chunk.documentName).filter(Boolean),
  };

  const priority = deal.adaptiveContext?.priority || 'general value';
  const comparison = {
    competitor: competitorLabel,
    verified: chunks.length > 0,
    currentRequirements: {
      users,
      priority,
      integrations: deal.requiredFeatures || [],
      implementationConcern: deal.adaptiveContext?.mainConcern === 'implementation',
      priceSensitivity: deal.adaptiveContext?.pricePressure === 'HIGH' || priority === 'pricing',
    },
    dealPilot: {
      price: quote.finalAmount,
      priceCurrency: quote.currency,
      pricePeriod: quote.billingCycle,
      planTier: tier,
      users,
      aiSalesAgent: 'Verified: Agora voice agent integration',
      crmCapabilities: deal.requiredFeatures?.length ? `Configured: ${deal.requiredFeatures.join(', ')}` : UNKNOWN,
      adaptiveAi: 'Verified: adaptive strategist',
      conversationMemory: 'Verified: persisted Deal State and conversation history',
      negotiationAi: 'Verified: deterministic pricing policy',
      humanHandoff: 'Verified: escalation context pack',
      integrations: deal.requiredFeatures?.length ? deal.requiredFeatures.join(', ') : UNKNOWN,
      implementation: deal.adaptiveContext?.mainConcern === 'implementation' ? 'Concern captured; support discussion recommended' : UNKNOWN,
      support: UNKNOWN,
    },
    competitor,
    advantages: [
      'Adaptive conversation memory',
      'Deterministic negotiation guardrails',
      'Integrated human handoff context',
    ],
    disadvantages: [
      competitorPrice === null ? 'Competitor price is not verified in the configured knowledge source' : 'Validate edition and feature parity before comparing price',
    ],
    recommendation: recommendation({ priority, dealPrice: quote.finalAmount, competitorPrice, users }),
    generatedAt: new Date(),
  };

  return comparison;
}
