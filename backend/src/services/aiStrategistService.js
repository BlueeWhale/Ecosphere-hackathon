import { GoogleGenAI } from '@google/genai';
import {
  SALES_INTENTS,
  RECOMMENDED_ACTIONS,
  SALES_STRATEGIES,
  INTENT_LIST,
  ACTION_LIST,
  STRATEGY_LIST,
} from '../constants/aiConstants.js';
import { OBJECTION_TYPES, OBJECTION_TYPE_LIST } from '../constants/dealConstants.js';
import { buildAIContext } from './aiContextBuilder.js';

const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

/**
 * Initializes Google Gen AI SDK client if API key is present.
 */
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey.includes('your_gemini_api_key')) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Deterministic Heuristic Fallback Parser
 * Engaged when GEMINI_API_KEY is not configured or if the Gemini API call fails.
 * Guarantees the application never crashes and continues with rule-based intelligence.
 */
export function heuristicFallbackAnalyze(customerMessage, deal) {
  const text = String(customerMessage || '').toLowerCase();

  // 1. Extract Number of Users
  let extractedUsers = null;
  const userMatch = text.match(/(\d+)\s*(?:users?|seats?|licenses?|people|reps?)/i);
  if (userMatch) {
    const parsed = parseInt(userMatch[1], 10);
    if (!isNaN(parsed) && parsed > 0) extractedUsers = parsed;
  }

  // 2. Extract Requested Discount
  let requestedDiscount = null;
  const discMatch = text.match(/(\d+)\s*%\s*(?:off|discount|concession)?/i);
  if (discMatch) {
    const parsedDisc = parseInt(discMatch[1], 10);
    if (!isNaN(parsedDisc) && parsedDisc >= 0 && parsedDisc <= 100) {
      requestedDiscount = parsedDisc;
    }
  }

  // 3. Extract Features
  const requiredFeatures = [];
  if (text.includes('rest api') || text.includes('api access')) requiredFeatures.push('REST API Access');
  if (text.includes('crm sync') || text.includes('hubspot') || text.includes('salesforce integration')) {
    requiredFeatures.push('CRM Sync');
  }
  if (text.includes('voice') || text.includes('real-time call')) requiredFeatures.push('Real-time Voice RTC');
  if (text.includes('custom workflow') || text.includes('workflow trigger')) requiredFeatures.push('Custom Workflow Triggers');

  // 4. Extract Timeline
  let timeline = null;
  if (text.includes('q1')) timeline = 'Q1';
  else if (text.includes('q2')) timeline = 'Q2';
  else if (text.includes('q3')) timeline = 'Q3';
  else if (text.includes('q4')) timeline = 'Q4';
  else if (text.includes('immediate') || text.includes('asap')) timeline = 'Immediate';
  else if (text.includes('next month')) timeline = 'Next Month';

  // 5. Extract Budget
  let budget = null;
  const budgetMatch = text.match(/(?:\$|usd|₹|rs\.?)\s*([\d,]+(?:\s*(?:k|m|million|thousand))?)/i);
  if (budgetMatch) budget = budgetMatch[0];

  // 6. Extract Competitors
  const competitors = [];
  const knownCompetitors = ['salesforce', 'hubspot', 'gong', 'chorus', 'outreach', 'salesloft', 'competitor x'];
  for (const comp of knownCompetitors) {
    if (text.includes(comp)) {
      competitors.push(comp.charAt(0).toUpperCase() + comp.slice(1));
    }
  }

  // 7. Extract Objections
  const objections = [];
  if (text.includes('cheaper') || text.includes('expensive') || text.includes('price') || text.includes('pricing') || text.includes('cost') || text.includes('too high')) {
    if (competitors.length > 0 && text.includes('cheaper')) {
      objections.push({
        type: OBJECTION_TYPES.COMPETITOR,
        text: `Customer noted competitor (${competitors.join(', ')}) has lower price point`,
      });
    }
    objections.push({
      type: OBJECTION_TYPES.PRICE,
      text: `Customer considers pricing too high or requested discount`,
    });
  }
  if (text.includes('budget') && (text.includes('tight') || text.includes('limited') || text.includes('exceed'))) {
    objections.push({
      type: OBJECTION_TYPES.BUDGET,
      text: 'Budget constraints mentioned by customer',
    });
  }
  if (text.includes('security') || text.includes('compliance') || text.includes('soc2') || text.includes('gdpr')) {
    objections.push({
      type: OBJECTION_TYPES.TRUST_SECURITY,
      text: 'Customer inquiring about security, compliance, or data isolation',
    });
  }

  // 8. Classify Intent
  let intent = SALES_INTENTS.GENERAL_QUESTION;
  let strategy = SALES_STRATEGIES.VALUE_DEFENSE;
  let recommendedAction = RECOMMENDED_ACTIONS.ASK_REQUIREMENT;

  if (requestedDiscount !== null || (text.includes('discount') || text.includes('concession'))) {
    intent = SALES_INTENTS.PRICE_NEGOTIATION;
    strategy = SALES_STRATEGIES.COMMERCIAL_CONCESSION;
    recommendedAction = requestedDiscount > 25 ? RECOMMENDED_ACTIONS.REQUEST_MANAGER_APPROVAL : RECOMMENDED_ACTIONS.OFFER_APPROVED_CONCESSION;
  } else if (competitors.length > 0) {
    intent = SALES_INTENTS.COMPETITOR_COMPARISON;
    strategy = SALES_STRATEGIES.COMPETITIVE_DIFFERENTIATION;
    recommendedAction = RECOMMENDED_ACTIONS.COMPARE_COMPETITOR;
  } else if (objections.length > 0) {
    intent = SALES_INTENTS.OBJECTION;
    strategy = SALES_STRATEGIES.VALUE_DEFENSE;
    recommendedAction = RECOMMENDED_ACTIONS.ADDRESS_OBJECTION;
  } else if (text.includes('demo') || text.includes('walkthrough') || text.includes('meeting')) {
    intent = SALES_INTENTS.DEMO_REQUEST;
    strategy = SALES_STRATEGIES.CLOSING_ACCELERATION;
    recommendedAction = RECOMMENDED_ACTIONS.BOOK_DEMO;
  } else if (extractedUsers !== null || requiredFeatures.length > 0 || timeline !== null) {
    intent = SALES_INTENTS.REQUIREMENTS_DISCOVERY;
    strategy = SALES_STRATEGIES.DISCOVERY_EXPANSION;
    recommendedAction = RECOMMENDED_ACTIONS.PRESENT_PRICING;
  } else if (text.includes('how much') || text.includes('pricing') || text.includes('quote') || text.includes('tiers')) {
    intent = SALES_INTENTS.PRICING_INQUIRY;
    strategy = SALES_STRATEGIES.VALUE_DEFENSE;
    recommendedAction = RECOMMENDED_ACTIONS.PRESENT_PRICING;
  }

  return {
    intent,
    customerGoal: `Inquiry regarding ${intent.toLowerCase().replace(/_/g, ' ')}`,
    extractedRequirements: {
      ...(extractedUsers ? { numberOfUsers: extractedUsers } : {}),
      ...(requiredFeatures.length > 0 ? { requiredFeatures } : {}),
      ...(timeline ? { timeline } : {}),
      ...(budget ? { budget } : {}),
    },
    competitors,
    objections,
    requestedDiscountPct: requestedDiscount,
    strategy,
    recommendedAction,
    confidence: 0.88,
    isFallback: true,
  };
}

/**
 * Deterministic Heuristic Response Generator
 */
export function heuristicFallbackResponse(customerMessage, deal, analysis) {
  const users = analysis.extractedRequirements?.numberOfUsers || deal.numberOfUsers || 50;
  const comp = analysis.competitors?.[0];

  if (analysis.requestedDiscountPct !== null && analysis.requestedDiscountPct > 25) {
    return `I understand you're looking for a ${analysis.requestedDiscountPct}% concession. Our authorized enterprise discount caps at 25% for ${users} seats, but I can route your specific request to our VP of Sales for commercial review.`;
  }

  if (analysis.intent === SALES_INTENTS.COMPETITOR_COMPARISON && comp) {
    return `I understand you are evaluating ${comp}. While they offer standard sales tools, DealPilot uniquely provides autonomous voice negotiation and adaptive call guidance. For ${users} users, we can ensure you get optimal commercial value.`;
  }

  if (analysis.intent === SALES_INTENTS.PRICE_NEGOTIATION || analysis.objections.some((o) => o.type === OBJECTION_TYPES.PRICE)) {
    return `I completely appreciate the pricing considerations. For a team of ${users} users, we have volume tier discounts that can significantly reduce your per-seat cost on an annual commitment.`;
  }

  if (analysis.intent === SALES_INTENTS.REQUIREMENTS_DISCOVERY) {
    return `Thank you for sharing your team requirements for ${users} users. We can configure our Enterprise Suite with full REST API access and dedicated CRM sync to fit your deployment timeline.`;
  }

  return `Thank you for the details. Based on your team's scope, I'd be happy to prepare a tailored proposal or schedule a product walkthrough with our technical team.`;
}

/**
 * Analyzes a customer message using Gemini 2.5 Flash, extracting intent, requirements,
 * competitors, objections, and sales strategy.
 */
export async function analyzeCustomerMessage({ customerMessage, deal }) {
  if (!customerMessage || typeof customerMessage !== 'string' || !customerMessage.trim()) {
    const error = new Error('customerMessage is required and must be a non-empty string');
    error.statusCode = 400;
    throw error;
  }

  const client = getGeminiClient();
  const context = buildAIContext(deal);

  if (!client) {
    console.log('[AI Strategist]: GEMINI_API_KEY not configured. Using deterministic fallback parser.');
    return heuristicFallbackAnalyze(customerMessage, deal);
  }

  const systemInstruction = `You are DealPilot's Senior AI Sales Strategist.
Analyze the customer's message in the context of the active deal, catalog tiers, and authorized pricing limits.
Classify the sales intent, extract useful deal requirements, detect competitor pressure, detect objections, and formulate a sales strategy.

STRICT CONSTRAINTS:
1. You DO NOT control final pricing. You may only recognize if the customer asked for a discount (e.g. 35%).
2. Output valid JSON ONLY matching the requested schema.
3. Allowed intents: ${INTENT_LIST.join(', ')}
4. Allowed actions: ${ACTION_LIST.join(', ')}
5. Allowed strategies: ${STRATEGY_LIST.join(', ')}
6. Allowed objection types: ${OBJECTION_TYPE_LIST.join(', ')}`;

  const prompt = `Context:
${JSON.stringify(context, null, 2)}

Customer Message:
"${customerMessage}"

Extract structured JSON with keys:
- intent (one of allowed intents)
- customerGoal (string)
- extractedRequirements: { numberOfUsers (integer or omit), requiredFeatures (array of strings or omit), timeline (string or omit), budget (string or omit) }
- competitors: array of competitor names mentioned (e.g. ["Salesforce"])
- objections: array of { type (one of allowed objection types), text (string) }
- requestedDiscountPct: number (0-100) if customer asked for discount, or null
- strategy: one of allowed strategies
- recommendedAction: one of allowed actions
- confidence: number (0.0 to 1.0)`;

  try {
    const response = await client.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const rawText = response.text?.trim() || '{}';
    const parsed = JSON.parse(rawText);

    // Validate and sanitize parsed output
    return {
      intent: INTENT_LIST.includes(parsed.intent) ? parsed.intent : SALES_INTENTS.GENERAL_QUESTION,
      customerGoal: parsed.customerGoal || 'Customer sales discussion',
      extractedRequirements: {
        ...(Number.isInteger(parsed.extractedRequirements?.numberOfUsers) && parsed.extractedRequirements.numberOfUsers > 0
          ? { numberOfUsers: parsed.extractedRequirements.numberOfUsers }
          : {}),
        ...(Array.isArray(parsed.extractedRequirements?.requiredFeatures)
          ? { requiredFeatures: parsed.extractedRequirements.requiredFeatures.map(String) }
          : {}),
        ...(parsed.extractedRequirements?.timeline ? { timeline: String(parsed.extractedRequirements.timeline) } : {}),
        ...(parsed.extractedRequirements?.budget ? { budget: String(parsed.extractedRequirements.budget) } : {}),
      },
      competitors: Array.isArray(parsed.competitors) ? parsed.competitors.map(String) : [],
      objections: Array.isArray(parsed.objections)
        ? parsed.objections
            .filter((o) => o && o.text)
            .map((o) => ({
              type: OBJECTION_TYPE_LIST.includes(o.type) ? o.type : OBJECTION_TYPES.OTHER,
              text: String(o.text),
            }))
        : [],
      requestedDiscountPct:
        parsed.requestedDiscountPct !== null && !isNaN(Number(parsed.requestedDiscountPct))
          ? Number(parsed.requestedDiscountPct)
          : null,
      strategy: STRATEGY_LIST.includes(parsed.strategy) ? parsed.strategy : SALES_STRATEGIES.VALUE_DEFENSE,
      recommendedAction: ACTION_LIST.includes(parsed.recommendedAction)
        ? parsed.recommendedAction
        : RECOMMENDED_ACTIONS.ASK_REQUIREMENT,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.9,
      isFallback: false,
    };
  } catch (err) {
    console.warn('[AI Strategist Warning]: Gemini API call failed. Falling back to deterministic parser.', err.message);
    return heuristicFallbackAnalyze(customerMessage, deal);
  }
}

/**
 * Generates a concise, context-grounded customer response.
 */
export async function generateSalesResponse({ customerMessage, deal, analysis }) {
  const client = getGeminiClient();
  const context = buildAIContext(deal);

  if (!client) {
    return heuristicFallbackResponse(customerMessage, deal, analysis);
  }

  const systemInstruction = `You are DealPilot's real-time AI sales agent.
Generate a concise, professional response to the customer.

RULES:
1. Speak naturally, concisely (1-3 sentences), and professionally.
2. Acknowledge the customer's point (e.g. competitor or price concern).
3. Ground answers strictly in the known catalog and authorized pricing.
4. NEVER promise an unauthorized discount above authorizedDiscountCeilingPct (${context.pricingContext.authorizedDiscountCeilingPct}%).
5. If customer asks for more than authorized, say you can offer the approved tier or submit a request to management for special approval.
6. NEVER invent nonexistent features or external prices.`;

  const prompt = `Context:
${JSON.stringify(context, null, 2)}

Strategy Analysis:
${JSON.stringify(analysis, null, 2)}

Customer Message:
"${customerMessage}"

Generate the customer-facing response string.`;

  try {
    const response = await client.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.3,
      },
    });

    return response.text?.trim() || heuristicFallbackResponse(customerMessage, deal, analysis);
  } catch (err) {
    console.warn('[AI Response Warning]: Gemini response generation failed. Using fallback response.', err.message);
    return heuristicFallbackResponse(customerMessage, deal, analysis);
  }
}
