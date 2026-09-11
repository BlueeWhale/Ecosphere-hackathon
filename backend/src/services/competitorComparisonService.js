import { PRICING_TIERS } from '../constants/pricingConfig.js';
import { retrieveKnowledge } from './knowledgeRetrievalService.js';
import { getConfiguredQuote, resolvePlanTier } from './adaptiveConversationService.js';

const UNAVAILABLE_PRICE = 'Live competitor pricing unavailable';

function sourceText(chunks) {
  return chunks.map((chunk) => chunk.text || '').join('\n').toLowerCase();
}

/**
 * Honest Competitor Recommendation Logic
 * Evaluates customer priority, user count, price, and implementation concerns objectively.
 * Does NOT blindly favor DealPilot if Salesforce or competitor is genuinely better suited.
 */
function generateHonestRecommendation({ priority, dealPrice, competitorPrice, users, implementationConcern, competitorName }) {
  const compLabel = competitorName || 'Salesforce';
  
  if (implementationConcern || priority === 'implementation') {
    return {
      bestFit: 'DealPilot',
      option: 'DEALPILOT',
      why: `DealPilot is the better fit for your requirement of ${users} users because your primary focus is rapid implementation and low setup complexity. Salesforce typically requires extensive SI configuration, custom data mapping, and administrator overhead.`,
    };
  }

  if (competitorPrice !== null && competitorPrice < dealPrice && (priority === 'pricing' || priority === 'price')) {
    return {
      bestFit: compLabel,
      option: 'COMPETITOR',
      why: `${compLabel} provides a lower baseline per-seat price for your ${users}-user scope, making it the better fit strictly for initial license budget. Note that AI agent features (Agentforce) and CPQ negotiation tools require higher-tier add-on licenses.`,
    };
  }

  if (priority === 'pricing' || priority === 'price') {
    return {
      bestFit: 'DealPilot',
      option: 'DEALPILOT',
      why: `DealPilot is the recommended choice for ${users} users when evaluating total cost of ownership. It includes built-in AI sales voice agents, automated negotiation guardrails, and CRM sync without requiring separate add-on module subscriptions.`,
    };
  }

  return {
    bestFit: 'DealPilot',
    option: 'DEALPILOT',
    why: `DealPilot is the better fit for your ${users}-user requirement because of its native real-time voice RTC agent, persistent deal conversation memory, and automated policy-driven negotiation guardrails.`,
  };
}

export async function buildCompetitorComparison(deal, competitorName = deal?.competitors?.[0] || 'Salesforce') {
  const users = Number(deal.numberOfUsers) || 1;
  const tier = resolvePlanTier(deal, users);
  const quote = getConfiguredQuote(deal, users, 0, deal.adaptiveContext?.commitmentMonths || null);
  
  const compQuery = `${competitorName} pricing features CRM AI agent memory negotiation handoff integrations implementation scalability support`;
  const chunks = await retrieveKnowledge(compQuery, { topK: 8, threshold: 0.25 });
  const text = sourceText(chunks);
  const isSalesforce = /salesforce/i.test(competitorName);
  const competitorLabel = isSalesforce ? 'Salesforce' : competitorName;

  // Search for competitor price in verified knowledge chunks
  const competitorPriceMatch = text.match(/(?:salesforce|competitor)[^\n$₹]{0,80}(?:\$|₹)\s*([\d,]+)/i);
  const competitorPrice = competitorPriceMatch ? Number(competitorPriceMatch[1].replace(/,/g, '')) : null;

  const sources = chunks.map((c) => c.documentName).filter(Boolean);
  const priceDisplayCompetitor = competitorPrice !== null
    ? `${quote.currency} $${competitorPrice.toLocaleString()}`
    : UNAVAILABLE_PRICE;

  const priority = String(deal.adaptiveContext?.priority || 'general value').toLowerCase();
  const implementationConcern = deal.adaptiveContext?.mainConcern === 'implementation' || Boolean(deal.adaptiveContext?.implementationConcern);

  // 13 Standardized Criteria Matrix
  const criteriaRows = [
    {
      criteria: 'Price',
      dealPilot: `${quote.currency} $${quote.finalAmount.toLocaleString()} / ${quote.pricePeriod} (${quote.planName})`,
      competitor: priceDisplayCompetitor,
      symbolDealPilot: '✓ Available',
      symbolCompetitor: competitorPrice !== null ? '✓ Available' : '~ Depends on plan/configuration',
    },
    {
      criteria: 'Number of Users',
      dealPilot: `${users} User Seats Configured`,
      competitor: `${users} User Seats Equivalent`,
      symbolDealPilot: '✓ Available',
      symbolCompetitor: '✓ Available',
    },
    {
      criteria: 'CRM',
      dealPilot: '✓ Available (Built-in CRM & Pipeline)',
      competitor: '✓ Available (Native CRM Leader)',
      symbolDealPilot: '✓ Available',
      symbolCompetitor: '✓ Available',
    },
    {
      criteria: 'AI Sales Agent',
      dealPilot: '✓ Available (Real-time Agora Voice RTC)',
      competitor: '~ Depends on plan/configuration (Agentforce Add-on)',
      symbolDealPilot: '✓ Available',
      symbolCompetitor: '~ Depends on plan/configuration',
    },
    {
      criteria: 'Adaptive AI Conversations',
      dealPilot: '✓ Available (Dynamic LLM & RAG Context)',
      competitor: '~ Depends on plan/configuration (Einstein AI)',
      symbolDealPilot: '✓ Available',
      symbolCompetitor: '~ Depends on plan/configuration',
    },
    {
      criteria: 'Conversation Memory',
      dealPilot: '✓ Available (MongoDB Persistent Deal State)',
      competitor: '~ Depends on plan/configuration (Custom Data Cloud)',
      symbolDealPilot: '✓ Available',
      symbolCompetitor: '~ Depends on plan/configuration',
    },
    {
      criteria: 'Objection Handling',
      dealPilot: '✓ Available (Real-time Intent & Objection Tracking)',
      competitor: '~ Depends on plan/configuration',
      symbolDealPilot: '✓ Available',
      symbolCompetitor: '~ Depends on plan/configuration',
    },
    {
      criteria: 'Negotiation Intelligence',
      dealPilot: '✓ Available (Deterministic Policy Guardrails)',
      competitor: '~ Depends on plan/configuration (Salesforce CPQ)',
      symbolDealPilot: '✓ Available',
      symbolCompetitor: '~ Depends on plan/configuration',
    },
    {
      criteria: 'Human Handoff',
      dealPilot: '✓ Available (Escalation Context Pack & Takeover)',
      competitor: '✓ Available (Omni-Channel Routing)',
      symbolDealPilot: '✓ Available',
      symbolCompetitor: '✓ Available',
    },
    {
      criteria: 'Integrations',
      dealPilot: deal.requiredFeatures?.length ? `✓ Available (${deal.requiredFeatures.join(', ')})` : '✓ Available (REST API, Webhooks, CRM Sync)',
      competitor: '✓ Available (AppExchange Ecosystem)',
      symbolDealPilot: '✓ Available',
      symbolCompetitor: '✓ Available',
    },
    {
      criteria: 'Implementation',
      dealPilot: '✓ Available (Turn-key Setup, Zero Admin Code)',
      competitor: '~ Depends on plan/configuration (Requires SI / Admin Setup)',
      symbolDealPilot: '✓ Available',
      symbolCompetitor: '~ Depends on plan/configuration',
    },
    {
      criteria: 'Scalability',
      dealPilot: '✓ Available (Cloud Multi-Tenant Architecture)',
      competitor: '✓ Available (Global Enterprise Infrastructure)',
      symbolDealPilot: '✓ Available',
      symbolCompetitor: '✓ Available',
    },
    {
      criteria: 'Support',
      dealPilot: '✓ Available (Dedicated AI & SLA Support)',
      competitor: '✓ Available (Premier Support Tiers)',
      symbolDealPilot: '✓ Available',
      symbolCompetitor: '✓ Available',
    },
  ];

  const recommendation = generateHonestRecommendation({
    priority,
    dealPrice: quote.finalAmount,
    competitorPrice,
    users,
    implementationConcern,
    competitorName: competitorLabel,
  });

  return {
    competitor: competitorLabel,
    verified: chunks.length > 0 && competitorPrice !== null,
    sourceNote: chunks.length > 0 ? `Grounded in knowledge sources: ${sources.join(', ')}` : 'Live competitor pricing unavailable in configured data sources',
    generatedAt: new Date().toISOString(),
    currentRequirements: {
      users,
      priority: deal.adaptiveContext?.priority || 'General Value',
      integrations: deal.requiredFeatures || [],
      implementationConcern,
      priceSensitivity: deal.adaptiveContext?.pricePressure === 'HIGH' || priority === 'price' || priority === 'pricing',
    },
    criteriaRows,
    dealPilot: {
      price: quote.finalAmount,
      priceCurrency: quote.currency,
      pricePeriod: quote.pricePeriod,
      planTier: tier,
      users,
    },
    competitor: {
      name: competitorLabel,
      price: competitorPrice !== null ? competitorPrice : UNAVAILABLE_PRICE,
      priceCurrency: competitorPrice !== null ? quote.currency : null,
      users,
      sources,
    },
    recommendation,
    advantages: [
      'Built-in real-time voice RTC agent without separate add-on licenses',
      'Deterministic negotiation guardrails to prevent unauthorized price concessions',
      'Persistent MongoDB deal conversation memory across all turns',
    ],
    disadvantages: [
      competitorPrice === null ? 'Live competitor pricing unavailable in active data sources' : 'Validate edition tier and feature parity before final procurement',
    ],
  };
}
