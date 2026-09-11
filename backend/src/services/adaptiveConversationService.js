import { OBJECTION_TYPES } from '../constants/dealConstants.js';
import { RECOMMENDED_ACTIONS, SALES_INTENTS, SALES_STRATEGIES } from '../constants/aiConstants.js';
import { PRICING_TIERS, SUPPORTED_TIERS } from '../constants/pricingConfig.js';
import { calculatePrice } from './pricingService.js';

const PRIORITY_PATTERNS = [
  { value: 'pricing', pattern: /\b(price|pricing|cost|budget|afford|expensive|cheaper|discount)\b/i },
  { value: 'integrations', pattern: /\b(integration|integrate|crm|salesforce|hubspot|api|sync)\b/i },
  { value: 'scalability', pattern: /\b(scale|scalab|growth|grow|expan|larger|more users|next year)\b/i },
  { value: 'implementation', pattern: /\b(implement|implementation|rollout|deploy|onboard|setup|it team)\b/i },
];

function findUserCount(text) {
  const explicitMatches = Array.from(text.matchAll(/(\d[\d,]*)\s*(?:users?|seats?|licenses?|people|reps?)/gi));
  if (explicitMatches.length > 0) {
    const count = Number(explicitMatches.at(-1)[1].replace(/,/g, ''));
    return Number.isInteger(count) && count > 0 ? count : null;
  }
  const matches = Array.from(text.matchAll(/(?:around|about|approximately|roughly|up to|for|need|have|with|of)\s*(\d[\d,]*)(?!\d)(?!\s*(?:months?|mos?))/gi));
  const match = matches.at(-1);
  if (!match) return null;
  const count = Number(match[1].replace(/,/g, ''));
  return Number.isInteger(count) && count > 0 ? count : null;
}

function findPriority(text) {
  return PRIORITY_PATTERNS.find(({ pattern }) => pattern.test(text))?.value || null;
}

function findCompetitors(text) {
  const knownCompetitors = ['salesforce', 'hubspot', 'gong', 'chorus', 'outreach', 'salesloft'];
  return knownCompetitors
    .filter((name) => text.toLowerCase().includes(name))
    .map((name) => name.replace(/^./, (char) => char.toUpperCase()));
}

function hasAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function previousAgentMessage(conversationHistory = []) {
  return [...conversationHistory].reverse().find((turn) => turn.speaker === 'agent')?.text || '';
}

function isAffirmative(text) {
  return /^(yes|yeah|yep|sure|okay|ok|alright|go ahead|sounds good|that works|please do|do it)[!.\s]*$/i.test(text.trim());
}

function isNegative(text) {
  return /^(no|nope|not now|maybe later|don't|do not)[!.\s]*$/i.test(text.trim());
}

function isProposalRequest(text) {
  return /\b(prepare|create|send|draft|build)\b.*\b(proposal|quote|plan|it)\b|\b(proposal|quote)\b.*\b(please|first|now)\b/i.test(text);
}

function findCommitmentMonths(text) {
  const match = text.match(/(?:for|commit(?:ment)?(?: of)?|purchase for|buy for)\s*(\d+)\s*(?:months?|mos?)/i);
  if (!match) return null;
  const months = Number(match[1]);
  return Number.isInteger(months) && months > 0 ? months : null;
}

export function resolvePlanTier(deal, userCount) {
  const explicitTier = String(deal?.product || '').toUpperCase().trim();
  if (SUPPORTED_TIERS.includes(explicitTier)) return explicitTier;

  const storedTier = String(deal?.pricingContext?.planTier || '').toUpperCase().trim();
  if (SUPPORTED_TIERS.includes(storedTier)) {
    const storedConfig = PRICING_TIERS[storedTier];
    if (userCount >= storedConfig.minimumUsers && userCount <= storedConfig.maximumUsers) return storedTier;
  }

  if (userCount <= PRICING_TIERS.STARTER.maximumUsers) return 'STARTER';
  if (userCount <= PRICING_TIERS.GROWTH.maximumUsers) return 'GROWTH';
  return 'ENTERPRISE';
}

export function getConfiguredQuote(deal, userCount, requestedDiscountPct = 0, commitmentMonths = null) {
  const planTier = resolvePlanTier(deal, userCount);
  const billingCycle = deal?.pricingContext?.billingCycle || 'ANNUAL';
  return calculatePrice({
    planTier,
    numberOfUsers: userCount,
    billingCycle,
    requestedDiscountPct,
    commitmentMonths,
  });
}

function formatMoney(amount, currency) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function inferPendingQuestion(conversationHistory = []) {
  const previous = previousAgentMessage(conversationHistory);
  if (!previous) return null;
  if (/proposal.*(?:or|and).*\b(schedule|walkthrough|demo)\b|\b(schedule|walkthrough|demo)\b.*proposal/i.test(previous)) {
    return { type: 'PROPOSAL_OR_DEMO', text: previous };
  }
  if (/\b(priority|main priority|prefer|which would you|what would you like)\b/i.test(previous)) {
    return { type: 'CHOICE', text: previous };
  }
  if (/\?$/.test(previous.trim())) return { type: 'OPEN', text: previous };
  return null;
}

export function getPendingQuestionState(agentResponse) {
  const text = String(agentResponse || '').trim();
  if (!text || !text.includes('?')) return { pendingQuestionText: '', pendingQuestionType: '' };
  const pending = inferPendingQuestion([{ speaker: 'agent', text }]);
  return {
    pendingQuestionText: text,
    pendingQuestionType: pending?.type || 'OPEN',
  };
}

export function isAffirmativeReply(customerMessage) {
  return isAffirmative(String(customerMessage || ''));
}

export function extractAdaptiveSignals(customerMessage, deal, conversationHistory = []) {
  const text = String(customerMessage || '').trim();
  const lower = text.toLowerCase();
  const pendingQuestion = inferPendingQuestion(conversationHistory);
  const affirmativeReply = isAffirmative(text) && Boolean(pendingQuestion);
  const negativeReply = isNegative(text) && Boolean(pendingQuestion);
  const proposalRequest = isProposalRequest(text) || (
    affirmativeReply && pendingQuestion?.type === 'PROPOSAL_OR_DEMO' && /\b(prepare|proposal)\b/i.test(lower)
  );
  const asksForPrice = /\b(how much|what(?:'s| is) the price|pricing|price|quote|cost)\b/i.test(lower);
  const pricingRequested = asksForPrice || /\b(expensive|cheaper|budget)\b/i.test(lower);
  const commitmentMonths = findCommitmentMonths(text);
  const priorCommitmentMonths = Number(deal?.adaptiveContext?.commitmentMonths) || null;
  const effectiveCommitmentMonths = commitmentMonths || priorCommitmentMonths;
  const commitmentEligible = effectiveCommitmentMonths !== null && effectiveCommitmentMonths >= 12;
  const previousUsers = Number(deal?.numberOfUsers) || null;
  const users = findUserCount(text);
  const competitors = findCompetitors(text);
  const priority = findPriority(text);
  const isRequirementChange = users !== null && previousUsers !== null && previousUsers > 1 && users !== previousUsers;
  const discountRequest = text.match(/(\d+)\s*%\s*(?:off|discount|concession)?|\b(discount|better deal|lower price|concession)\b/i);
  const requestedDiscountPct = discountRequest?.[1] ? Number(discountRequest[1]) : null;
  const asksForHuman = hasAny(lower, [/\b(human|person|sales rep|salesperson|representative|specialist|transfer|talk to someone)\b/i]);
  const cannotAnswer = hasAny(lower, [/\b(i do not know|you do not know|not sure|cannot answer|can't answer|no answer|unknown)\b/i]);
  const enterpriseRequirement = /\b(global rollout|multi[- ]region|complex integration|custom contract|enterprise procurement|enterprise deployment)\b/i.test(lower);
  const specialPricing = /\b(special pricing|custom pricing|approval|approve|exception)\b/i.test(lower);
  const repeatedObjection = conversationHistory.filter((turn) => turn.speaker === 'customer' && /\b(but|however|concern|objection|too expensive|doesn't work|not enough)\b/i.test(turn.text || '')).length >= 2;
  const asksForDemo = hasAny(lower, [/\b(demo|demonstration|walkthrough|trial)\b/i]);
  const asksToRecall = hasAny(lower, [/\b(earlier|before|previously|you said|you mentioned|remind me|what did you say)\b/i]);
  const asksForComparison = hasAny(lower, [/\b(different|difference|versus|vs\.?|compare|comparison|why choose|beat)\b/i]);
  const trustConcern = hasAny(lower, [/\b(safe|security|secure|data|privacy|compliance|certification|trust|soc|gdpr)\b/i]);
  const implementationConcern = hasAny(lower, [/\b(implement|implementation|rollout|deploy|onboard|setup|small it|it team)\b/i]);
  const unsuitable = hasAny(lower, [
    /\b(not|isn't|is not|doesn't|does not)\b.*\b(suitable|fit|right|work)\b/i,
    /\b(won't|will not)\b.*\b(work|fit)\b/i,
    /\bnot a good fit\b/i,
  ]);
  const prefersSmallerPlan = users !== null && users <= 3 && /\b(don't need|do not need|not need|small|basic)\b.*\b(enterprise|features?)\b/i.test(lower);
  const pricePressure = hasAny(lower, [/\b(cheap|cheaper|expensive|cost|price|pricing|budget|too high|discount|better deal)\b/i]);
  const priceObjection = hasAny(lower, [/\b(cheap|cheaper|expensive|overpriced|budget|too high|too costly)\b/i]);
  const pricePriorityAlreadyKnown = Boolean(deal?.adaptiveContext?.priority === 'pricing' || deal?.adaptiveContext?.priority === 'price');
  const competitor = competitors[0] || deal?.competitors?.[0] || null;
  const hasPriorContext = conversationHistory.length > 0 || Boolean(deal?.adaptiveContext?.mainConcern);
  const expansionPotential = users !== null && (users >= 200 || /\b(next year|grow|growth|expand|larger|more)\b/i.test(lower))
    ? 'HIGH'
    : deal?.adaptiveContext?.expansionPotential || 'UNKNOWN';

  let intent = SALES_INTENTS.GENERAL_QUESTION;
  let strategy = SALES_STRATEGIES.VALUE_DEFENSE;
  let recommendedAction = RECOMMENDED_ACTIONS.ANSWER_PRODUCT_QUESTION;

  if (asksForHuman) {
    intent = SALES_INTENTS.HUMAN_ESCALATION;
    strategy = SALES_STRATEGIES.HUMAN_HANDOFF;
    recommendedAction = RECOMMENDED_ACTIONS.ESCALATE_HUMAN;
  } else if (asksForDemo) {
    intent = SALES_INTENTS.DEMO_REQUEST;
    strategy = SALES_STRATEGIES.CLOSING_ACCELERATION;
      return 'I understand. Is the main concern your overall budget, the value you\'re getting, or the price compared with another provider?';
    recommendedAction = RECOMMENDED_ACTIONS.ADDRESS_OBJECTION;
  } else if (asksForComparison || competitors.length > 0) {
    intent = SALES_INTENTS.COMPETITOR_COMPARISON;
    strategy = SALES_STRATEGIES.COMPETITIVE_DIFFERENTIATION;
    recommendedAction = RECOMMENDED_ACTIONS.COMPARE_COMPETITOR;
  } else if (requestedDiscountPct !== null || /\b(discount|better deal|concession)\b/i.test(lower)) {
    intent = SALES_INTENTS.PRICE_NEGOTIATION;
    strategy = SALES_STRATEGIES.COMMERCIAL_CONCESSION;
    recommendedAction = RECOMMENDED_ACTIONS.OFFER_APPROVED_CONCESSION;
  } else if (pricePressure) {
    intent = asksForPrice
      ? SALES_INTENTS.PRICING_INQUIRY
      : SALES_INTENTS.OBJECTION;
    recommendedAction = intent === SALES_INTENTS.PRICING_INQUIRY
      ? RECOMMENDED_ACTIONS.PRESENT_PRICING
      : RECOMMENDED_ACTIONS.ADDRESS_OBJECTION;
  } else if (users !== null || implementationConcern || priority) {
    intent = SALES_INTENTS.REQUIREMENTS_DISCOVERY;
    strategy = SALES_STRATEGIES.DISCOVERY_EXPANSION;
    recommendedAction = RECOMMENDED_ACTIONS.ASK_REQUIREMENT;
  }

  if (affirmativeReply || negativeReply) {
    intent = SALES_INTENTS.FOLLOW_UP;
    strategy = SALES_STRATEGIES.DISCOVERY_EXPANSION;
    recommendedAction = RECOMMENDED_ACTIONS.FOLLOW_UP;
  }

  const objections = [];
  if (trustConcern) objections.push({ type: OBJECTION_TYPES.TRUST_SECURITY, text: 'Customer asked about data safety or security.' });
  if (implementationConcern) objections.push({ type: OBJECTION_TYPES.FEATURE, text: 'Customer is concerned about implementation effort or risk.' });
  if (priceObjection || requestedDiscountPct !== null) objections.push({ type: OBJECTION_TYPES.PRICE, text: 'Customer raised a price, budget, or value concern.' });
  if (competitor && /\b(cheap|cheaper|price|beat)\b/i.test(lower)) {
    objections.push({ type: OBJECTION_TYPES.COMPETITOR, text: `Customer compared pricing with ${competitor}.` });
  }

  const mainConcern = implementationConcern ? 'implementation' : trustConcern ? 'security' : priority;
  const buyingIntent = asksForDemo || asksForHuman
    ? 'HIGH'
    : requestedDiscountPct !== null || asksForComparison || pricePressure
      ? 'MEDIUM'
      : deal?.buyingIntent || 'UNKNOWN';
  const buyingStage = asksForDemo
    ? 'DEMO'
    : requestedDiscountPct !== null
      ? 'NEGOTIATION'
      : deal?.adaptiveContext?.buyingStage || null;
  const handoffReason = asksForHuman
    ? 'Customer explicitly requested a human specialist'
    : cannotAnswer
      ? 'AI could not confidently answer the customer'
      : enterpriseRequirement
        ? 'Complex or enterprise requirement needs a specialist'
        : specialPricing
          ? 'Special pricing or approval is required'
          : repeatedObjection
            ? 'Repeated objection could not be resolved by AI'
            : '';
  const trustLevel = trustConcern
    ? 'CONCERNED'
    : deal?.adaptiveContext?.trustLevel || 'UNKNOWN';
  const negotiationStyle = requestedDiscountPct !== null || priceObjection
    ? 'VALUE_SENSITIVE'
    : deal?.adaptiveContext?.negotiationStyle || 'CONSULTATIVE';
  const communicationStyle = /(short|brief|quick|just tell me)/i.test(lower)
    ? 'CONCISE'
    : deal?.adaptiveContext?.communicationStyle || 'CONSULTATIVE';
  const nextBestAction = asksForHuman || handoffReason
    ? 'ESCALATE'
    : asksForDemo
      ? 'CLOSE'
      : trustConcern
        ? 'REASSURE'
        : asksForComparison || competitors.length > 0
          ? 'COMPARE'
          : requestedDiscountPct !== null || priceObjection
            ? 'NEGOTIATE'
            : asksForPrice || users === null
              ? 'DISCOVER'
              : 'EDUCATE';

  return {
    intent,
    strategy,
    recommendedAction,
    extractedRequirements: users ? { numberOfUsers: users } : {},
    competitors,
    objections,
    requestedDiscountPct,
    buyingIntent,
    buyingStage,
    priority,
    expansionPotential,
    comparisonRequested: asksForComparison || competitors.length > 0,
    pricePressure: pricePressure ? 'HIGH' : deal?.adaptiveContext?.pricePressure || 'UNKNOWN',
    comparison: asksForComparison || competitor ? 'ACTIVE' : deal?.adaptiveContext?.comparison || 'INACTIVE',
    mainConcern: mainConcern || deal?.adaptiveContext?.mainConcern || null,
    hiddenConcern: implementationConcern ? 'implementation risk' : deal?.adaptiveContext?.hiddenConcern || null,
    trustMode: trustConcern || deal?.adaptiveContext?.trustMode === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
    requirementChanged: isRequirementChange,
    asksToRecall,
    asksForHuman,
    handoffRequired: Boolean(handoffReason),
    handoffReason,
    asksForDemo,
    affirmativeReply,
    negativeReply,
    proposalRequest,
    pricingRequested,
    asksForPrice,
    commitmentMonths: effectiveCommitmentMonths,
    commitmentEligible,
    pricePriorityAlreadyKnown,
    prefersSmallerPlan,
    pendingQuestion,
    unsuitable,
    trustLevel,
    negotiationStyle,
    communicationStyle,
    nextBestAction,
  };
}

export function buildAdaptiveResponse({ customerMessage, deal, analysis, conversationHistory = [] }) {
  const text = String(customerMessage || '').trim();
  const lower = text.toLowerCase();
  const state = deal?.adaptiveContext || {};
  const users = analysis.extractedRequirements?.numberOfUsers || deal?.numberOfUsers || 1;
  const competitor = analysis.competitors?.[0] || deal?.competitors?.[0] || 'the other provider';
  const pricingUsers = analysis.extractedRequirements?.numberOfUsers || deal?.numberOfUsers || 1;
  const pricingPlan = PRICING_TIERS[resolvePlanTier(deal, pricingUsers)];
  const shouldQuote = analysis.pricingRequested || analysis.requirementChanged;
  const quote = shouldQuote
    ? getConfiguredQuote(deal, pricingUsers, 0, analysis.commitmentMonths)
    : null;

  if (analysis.unsuitable) {
    return "That's completely fine. Based on what you've told me, if our solution doesn't match your requirements, I wouldn't recommend forcing the purchase. I can help identify the option that best fits your needs.";
  }

  if (analysis.proposalRequest) {
    return `Absolutely. I'll prepare the proposal based on your ${pricingUsers}-user requirement. Before I finalize it, I'd like to confirm your preferred timeline. When are you planning to implement the solution?`;
  }
  if (analysis.affirmativeReply && analysis.pendingQuestion?.type === 'PROPOSAL_OR_DEMO') {
    return 'Certainly. Would you like me to prepare the tailored proposal first, or would you prefer to schedule the product walkthrough?';
  }
  if (analysis.affirmativeReply) {
    return 'Certainly. I can take the next step. Would you prefer to review a tailored proposal, discuss implementation, or schedule a product walkthrough?';
  }
  if (analysis.negativeReply) {
    return 'Understood. What would be most useful to explore next: pricing, integrations, scalability, or implementation?';
  }

  if (analysis.asksForHuman) {
    return "Of course. I'll connect you with a sales specialist and provide them with the conversation context so you don't have to repeat everything.";
  }
  if (analysis.pricingRequested && !analysis.extractedRequirements?.numberOfUsers && !deal?.numberOfUsers) {
    const plans = Object.values(PRICING_TIERS)
      .map((plan) => {
        const sixMonthOption = plan.sixMonthAmount
          ? ` or ${formatMoney(plan.sixMonthAmount, 'USD')} / 6 months`
          : '';
        return `${plan.name}: ${formatMoney(plan.priceAmount, 'USD')} / ${plan.pricePeriod}${sixMonthOption}`;
      })
      .join('; ');
    return `Our plans are ${plans}. I can help match the right plan to your requirements. Which plan or set of features are you considering?`;
  }
  if (analysis.asksToRecall && (conversationHistory.length > 0 || state.mainConcern)) {
    if (state.mainConcern === 'implementation') {
      return "Earlier, you mentioned that your IT team is small and that implementation is a concern. That's why I highlighted implementation time and support.";
    }
    return `Earlier, we discussed your ${state.priority || 'requirements'} priority and the ${deal?.numberOfUsers || users}-user scope. I am carrying that context forward.`;
  }
  if (analysis.asksForDemo) {
    return `Absolutely. Based on your ${users}-user requirement and integration needs, an enterprise demo would be a good next step. What date and time works best for you?`;
  }
  if (analysis.trustMode === 'ACTIVE') {
    return "That's a reasonable concern. I can explain the available data-handling and security information, or connect you with a specialist if you'd like a more detailed discussion.";
  }
  if (analysis.prefersSmallerPlan) {
    return `With ${users} users and no need for enterprise features, I wouldn't recommend the enterprise plan. A smaller plan should be sufficient for your requirements. Would you like me to outline the available smaller-plan options?`;
  }
  if (analysis.requirementChanged) {
    return `Understood. I'll update your requirement to ${users} users. At that scale, the enterprise plan may be more suitable. Would you like me to explain the enterprise option?`;
  }
  if (analysis.comparisonRequested && competitor) {
    if (/\b(compare|comparison|versus|vs\.?|side[- ]by[- ]side)\b/i.test(lower)) {
      return `Absolutely. I can compare DealPilot with ${competitor} based on pricing, integrations, scalability, features, and implementation. Which factor matters most to you?`;
    }
    if (analysis.pricePressure === 'HIGH' && /\b(salesforce)\b/i.test(competitor)) {
      return `I understand. Salesforce can be competitive on price depending on the edition and features selected. The better comparison is the total value for your specific requirements, including integrations, scalability, implementation, and support. Since price is important to you, I can compare the options based on your current ${pricingUsers}-user requirement. What would you like to compare first?`;
    }
    if (/\b(salesforce)\b/i.test(competitor) && analysis.pricePressure !== 'HIGH') {
      return 'DealPilot focuses on adaptive AI-powered sales conversations and real-time negotiation. It understands changing customer requirements and conversation context rather than simply following a fixed sales script.';
    }
    return `We can compare DealPilot with ${competitor} based on pricing, integrations, scalability, and implementation. Besides price, which factor is most important to you?`;
  }
  if (analysis.requestedDiscountPct !== null || /\b(discount|better deal|concession)\b/i.test(lower)) {
    if (analysis.commitmentMonths && analysis.commitmentMonths < 12) {
      return 'Monthly and six-month plans do not receive discounts. Discounts are considered only for annual plans.';
    }
    if (pricingPlan.pricePeriod === 'month') {
      return `The ${pricingPlan.name} plan is ${formatMoney(pricingPlan.priceAmount, 'USD')} / month, and monthly plans do not receive discounts. I can help confirm whether an annual plan better fits your requirements.`;
    }
    if (analysis.requestedDiscountPct >= 15 && pricingUsers < 200) {
      return 'I can explore that. A 15% discount requires a 200+ user plan and an eligible commitment. If you are comfortable with a larger user plan, I may be able to offer a better price.';
    }
    if (analysis.requestedDiscountPct >= 10 && !analysis.commitmentEligible) {
      return 'I can explore that. A 10% discount requires annual payment. Would you be comfortable with an annual commitment?';
    }
    if (analysis.requestedDiscountPct >= 5 && !analysis.commitmentEligible) {
      return 'I can explore that. A 5% discount requires a 12-month commitment. Would you be comfortable with that term?';
    }
    if (analysis.commitmentEligible) {
      const eligibleQuote = getConfiguredQuote(deal, pricingUsers, analysis.requestedDiscountPct || 0, analysis.commitmentMonths);
      return `Great. With a ${analysis.commitmentMonths}-month commitment, you're eligible for the applicable annual-plan discount. Your updated price would be ${formatMoney(eligibleQuote.finalAmount, eligibleQuote.currency)}. Would you like me to prepare the proposal?`;
    }
    if (!analysis.commitmentEligible) {
      return 'I can check the available pricing flexibility. Discounts are available for commitments of 12 months or more. Would you be comfortable with a 12-month or longer commitment?';
    }
    return `I can explore that. If you're considering an annual commitment or the larger ${users}-user requirement, I may be able to work toward a better price.`;
  }
  if (analysis.intent === SALES_INTENTS.OBJECTION && analysis.objections?.some((objection) => objection.type === OBJECTION_TYPES.PRICE)) {
    return 'I understand. Is the main concern your overall budget, the value you\'re getting, or the price compared with another provider?';
  }
  if (analysis.commitmentMonths !== null && analysis.commitmentMonths < 12) {
    return 'In that case, the annual commitment discount would not apply. I can provide the standard pricing for a 3-month plan. Would you like me to proceed with that?';
  }
  if (analysis.commitmentEligible && analysis.commitmentMonths >= 12 && (analysis.affirmativeReply || /\b(purchase|commit|buy)\b/i.test(lower))) {
    const committedQuote = getConfiguredQuote(deal, pricingUsers, 0, analysis.commitmentMonths);
    return `Great. With a ${analysis.commitmentMonths}-month commitment, you're eligible for the applicable annual-plan discount. Your updated price would be ${formatMoney(committedQuote.finalAmount, committedQuote.currency)}. Would you like me to prepare the proposal?`;
  }
  if (analysis.intent === SALES_INTENTS.PRICING_INQUIRY || analysis.pricingRequested) {
    return `The ${quote.planName} plan is ${formatMoney(quote.priceAmount, quote.currency)} / ${quote.pricePeriod}. This includes ${quote.negotiationBounds.planFeatures.join(', ')}. Based on your requirements, this looks like a suitable option. Would you like me to prepare a tailored proposal or schedule a product walkthrough?`;
  }
  if (analysis.mainConcern === 'implementation') {
    return 'That makes sense. Since your IT team is small, implementation time and effort are especially important. I can explain the implementation process and the support available. Would you like me to walk you through it?';
  }
  if (analysis.extractedRequirements?.numberOfUsers) {
    return `Absolutely. For around ${users} users, I can help you find the right plan. What is your main priority — pricing, integrations, scalability, or ease of implementation?`;
  }
  return null;
}
