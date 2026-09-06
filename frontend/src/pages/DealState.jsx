import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { BrainCircuit, Activity, Clock, PhoneCall } from 'lucide-react';
import { dealAPI } from '../services/api';
import { VoiceAgentModal } from '../components/voice/VoiceAgentModal';
import { subscribeToDealUpdates } from '../services/socketClient';

export function DealState() {
  const [dealState, setDealState] = useState(null);
  const [dealsList, setDealsList] = useState([]);
  const [selectedDealId, setSelectedDealId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isVoiceCallActive, setIsVoiceCallActive] = useState(false);
  const [simulatedMessage, setSimulatedMessage] = useState('Salesforce is cheaper and I need 200 users. Can you give me 20% off?');
  const [aiResult, setAiResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleRunStrategist = async () => {
    if (!selectedDealId || !simulatedMessage.trim()) return;
    try {
      setIsAnalyzing(true);
      const res = await dealAPI.respondToCustomer(selectedDealId, { message: simulatedMessage });
      if (res.data?.success) {
        setAiResult(res.data.data);
        if (res.data.data.dealState) {
          setDealState(res.data.data.dealState);
        }
      }
    } catch (err) {
      console.error('Failed to run strategist:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 1. Fetch available deals on mount
  useEffect(() => {
    async function loadDeals() {
      try {
        setLoading(true);
        const res = await dealAPI.getDeals();
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setDealsList(res.data.data);
          setSelectedDealId(res.data.data[0]._id);
        }
      } catch (err) {
        console.error('Failed to load deals:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDeals();
  }, []);

  // 2. Fetch structured deal state whenever selected deal changes
  useEffect(() => {
    if (!selectedDealId) return;

    async function loadState() {
      try {
        const res = await dealAPI.getDealState(selectedDealId);
        if (res.data?.success) {
          setDealState(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load deal state:', err);
      }
    }
    loadState();

    const unsubscribe = subscribeToDealUpdates(selectedDealId, (updated) => {
      setDealState(updated);
    });

    return () => unsubscribe();
  }, [selectedDealId]);

  const displayState = dealState || {
    company: 'Nexus Technologies',
    customer: { name: 'Rohan Sharma' },
    requirements: {
      numberOfUsers: 50,
      budget: '₹5,000,000 / year',
      product: 'DealPilot Enterprise Suite',
      requiredFeatures: ['REST API Access', 'Custom Workflow Triggers'],
    },
    currentStage: 'NEGOTIATION',
    dealScore: 40,
    buyingIntent: 'HIGH',
    competitors: ['Competitor X'],
    objections: [{ type: 'PRICE', text: 'Price is higher than Competitor X standard plan', status: 'UNRESOLVED' }],
    nextBestAction: 'Offer Enterprise Volume Discount with annual commitment requirement',
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dynamic Deal State"
        subtitle="Real-time structured memory representation persisted in MongoDB."
        action={
          <div className="flex items-center gap-3">
            {dealsList.length > 1 && (
              <select
                value={selectedDealId || ''}
                onChange={(e) => setSelectedDealId(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2"
              >
                {dealsList.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.company} ({d._id.slice(-6)})
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={() => setIsVoiceCallActive(true)}
              disabled={!selectedDealId}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-xl transition-all shadow-lg shadow-emerald-600/20 text-xs disabled:opacity-50"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Start Voice Call</span>
            </button>
          </div>
        }
      />

      <Card
        title={
          <div className="flex items-center gap-3">
            <span>Active Deal Memory Inspector</span>
            {dealState && (
              <Badge variant="success" className="text-[10px]">
                Live MongoDB State
              </Badge>
            )}
          </div>
        }
        subtitle="Entity parameters dynamically updated and merged during call execution"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
            <p className="text-slate-400">
              Customer Name: <span className="text-white font-semibold">{displayState.customer?.name || 'Not Identified'}</span>
            </p>
            <p className="text-slate-400">
              Company: <span className="text-white font-semibold">{displayState.company || 'Unknown'}</span>
            </p>
            <p className="text-slate-400">
              Target Seats: <span className="text-white font-semibold">{displayState.requirements?.numberOfUsers || 1}</span>
            </p>
            <p className="text-slate-400">
              Budget Limit: <span className="text-white font-semibold">{displayState.requirements?.budget || 'Pending'}</span>
            </p>
            <p className="text-slate-400">
              Product Interest: <span className="text-white font-semibold">{displayState.requirements?.product || 'Standard Suite'}</span>
            </p>
            <div className="pt-2 border-t border-slate-800 flex items-center gap-4">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Stage</span>
                <Badge variant="purple">{displayState.currentStage || 'DISCOVERY'}</Badge>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Deal Score</span>
                <span className="font-bold text-emerald-400 text-sm">{displayState.dealScore ?? 10}/100</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Buying Intent</span>
                <Badge variant="success">{displayState.buyingIntent || 'UNKNOWN'}</Badge>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div>
              <span className="text-slate-400 block mb-1">Extracted Requirements:</span>
              <div className="flex flex-wrap gap-1">
                <Badge variant="primary">{displayState.requirements?.numberOfUsers || 1} User Seats</Badge>
                {displayState.requirements?.requiredFeatures?.map((req, i) => (
                  <Badge key={i} variant="primary">
                    {req}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Competitors & Objections:</span>
              <div className="flex flex-wrap gap-1">
                {displayState.competitors?.map((comp, i) => (
                  <Badge key={i} variant="warning">
                    Vs {comp}
                  </Badge>
                ))}
                {displayState.objections?.map((obj, i) => (
                  <Badge key={i} variant="danger">
                    [{obj.type || 'OBJECTION'}] {obj.text}
                  </Badge>
                ))}
                {(!displayState.competitors || displayState.competitors.length === 0) &&
                  (!displayState.objections || displayState.objections.length === 0) && (
                    <span className="text-slate-500 text-[11px]">No active competitor pressure or objections detected</span>
                  )}
              </div>
            </div>

            {displayState.lastUpdated && (
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Last Memory Sync: {new Date(displayState.lastUpdated).toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Pricing Context & Quote Banner */}
        {displayState.pricingContext && displayState.pricingContext.quotedAmount > 0 && (
          <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Quoted Amount</span>
                <span className="font-extrabold text-emerald-400 text-base">
                  ${Number(displayState.pricingContext.quotedAmount).toLocaleString()}{' '}
                  <span className="text-xs font-normal text-slate-400">/ {displayState.pricingContext.billingCycle || 'annual'}</span>
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Plan Tier</span>
                <Badge variant="primary">{displayState.pricingContext.planTier || 'ENTERPRISE'}</Badge>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Applied Concession</span>
                <span className="font-bold text-white">
                  {displayState.pricingContext.offeredDiscountPct || displayState.pricingContext.approvedDiscountPct || 0}% OFF
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Policy Check</span>
                {displayState.pricingContext.policyStatus === 'APPROVED' ? (
                  <Badge variant="success">POLICY APPROVED</Badge>
                ) : displayState.pricingContext.policyStatus === 'REQUIRES_APPROVAL' ? (
                  <Badge variant="warning">REQUIRES VP APPROVAL</Badge>
                ) : (
                  <Badge variant="outline">{displayState.pricingContext.policyStatus || 'PENDING'}</Badge>
                )}
              </div>
            </div>
            {displayState.pricingContext.policyReason && (
              <p className="text-[11px] text-slate-400 max-w-md italic">
                "{displayState.pricingContext.policyReason}"
              </p>
            )}
          </div>
        )}

        {displayState.adaptiveContext?.comparisonData && (
          <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white">Competitor Comparison</h3>
                <p className="text-[11px] text-slate-400">
                  Current {displayState.adaptiveContext.comparisonData.currentRequirements?.users || 1}-user requirement and live Deal State.
                </p>
              </div>
              <Badge variant={displayState.adaptiveContext.comparisonData.verified ? 'success' : 'warning'}>
                {displayState.adaptiveContext.comparisonData.verified ? 'SOURCE GROUNDED' : 'PARTIAL DATA'}
              </Badge>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="min-w-[720px] w-full text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="px-3 py-2">Capability</th>
                    <th className="px-3 py-2">DealPilot</th>
                    <th className="px-3 py-2">{displayState.adaptiveContext.comparisonData.competitor?.name || 'Competitor'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {[
                    ['Price', displayState.adaptiveContext.comparisonData.dealPilot?.price ? `${displayState.adaptiveContext.comparisonData.dealPilot.priceCurrency} ${Number(displayState.adaptiveContext.comparisonData.dealPilot.price).toLocaleString()}` : 'Not configured', displayState.adaptiveContext.comparisonData.competitor?.price || 'Not verified'],
                    ['Users', displayState.adaptiveContext.comparisonData.dealPilot?.users, displayState.adaptiveContext.comparisonData.competitor?.users],
                    ['AI sales agent', displayState.adaptiveContext.comparisonData.dealPilot?.aiSalesAgent, displayState.adaptiveContext.comparisonData.competitor?.aiSalesAgent],
                    ['CRM capabilities', displayState.adaptiveContext.comparisonData.dealPilot?.crmCapabilities, displayState.adaptiveContext.comparisonData.competitor?.crmCapabilities],
                    ['Adaptive AI', displayState.adaptiveContext.comparisonData.dealPilot?.adaptiveAi, displayState.adaptiveContext.comparisonData.competitor?.adaptiveAi],
                    ['Conversation memory', displayState.adaptiveContext.comparisonData.dealPilot?.conversationMemory, displayState.adaptiveContext.comparisonData.competitor?.conversationMemory],
                    ['Negotiation AI', displayState.adaptiveContext.comparisonData.dealPilot?.negotiationAi, displayState.adaptiveContext.comparisonData.competitor?.negotiationAi],
                    ['Human handoff', displayState.adaptiveContext.comparisonData.dealPilot?.humanHandoff, displayState.adaptiveContext.comparisonData.competitor?.humanHandoff],
                    ['Integrations', displayState.adaptiveContext.comparisonData.dealPilot?.integrations, displayState.adaptiveContext.comparisonData.competitor?.integrations],
                    ['Implementation', displayState.adaptiveContext.comparisonData.dealPilot?.implementation, displayState.adaptiveContext.comparisonData.competitor?.implementation],
                    ['Support', displayState.adaptiveContext.comparisonData.dealPilot?.support, displayState.adaptiveContext.comparisonData.competitor?.support],
                  ].map(([label, dealPilotValue, competitorValue]) => (
                    <tr key={label}>
                      <td className="px-3 py-2 text-slate-400 font-medium">{label}</td>
                      <td className="px-3 py-2">{dealPilotValue || 'Not verified'}</td>
                      <td className="px-3 py-2">{competitorValue || 'Not verified'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <span className="text-slate-400 block mb-1">Recommended option</span>
                <Badge variant="primary">{displayState.adaptiveContext.comparisonData.recommendation?.option || 'REVIEW'}</Badge>
              </div>
              <div className="md:col-span-2">
                <span className="text-slate-400 block mb-1">Reason</span>
                <p className="text-slate-200">{displayState.adaptiveContext.comparisonData.recommendation?.reason}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block mb-1">Key advantages</span>
                <p className="text-emerald-300">{displayState.adaptiveContext.comparisonData.advantages?.join(' • ')}</p>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Key disadvantages / unknowns</span>
                <p className="text-amber-300">{displayState.adaptiveContext.comparisonData.disadvantages?.join(' • ')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Next Best Action Banner */}
        <div className="mt-4 p-4 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center gap-3">
          <BrainCircuit className="w-5 h-5 text-blue-400 shrink-0" />
          <div className="text-xs">
            <span className="font-semibold text-blue-400 block">Computed Next Best Action:</span>
            <span className="text-slate-200">{displayState.nextBestAction}</span>
          </div>
        </div>
      </Card>

      {/* AI Sales Strategist Intelligence Panel */}
      <Card
        title={
          <div className="flex items-center gap-3">
            <span>Adaptive AI Sales Strategist</span>
            <Badge variant="purple" className="text-[10px]">Gemini 2.5 Intelligence</Badge>
          </div>
        }
        subtitle="Real-time sales intent classification, objection understanding, and grounded response synthesis"
      >
        <div className="space-y-4 text-xs">
          <div className="flex gap-2">
            <input
              type="text"
              value={simulatedMessage}
              onChange={(e) => setSimulatedMessage(e.target.value)}
              placeholder="Enter customer statement to test AI Strategist..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleRunStrategist}
              disabled={isAnalyzing || !selectedDealId}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-50 text-xs shrink-0"
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze & Respond'}
            </button>
          </div>

          {aiResult && (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Detected Intent</span>
                  <Badge variant="primary">{aiResult.analysis.intent}</Badge>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Strategy</span>
                  <Badge variant="purple">{aiResult.analysis.strategy}</Badge>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Recommended Action</span>
                  <Badge variant="warning">{aiResult.analysis.recommendedAction}</Badge>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Confidence</span>
                  <span className="font-bold text-emerald-400">
                    {Math.round(aiResult.analysis.confidence * 100)}%
                  </span>
                </div>
              </div>

              {aiResult.analysis.objections?.length > 0 && (
                <div>
                  <span className="text-slate-400 block mb-1">Detected Objections:</span>
                  <div className="flex flex-wrap gap-1">
                    {aiResult.analysis.objections.map((obj, i) => (
                      <Badge key={i} variant="danger">
                        [{obj.type}] {obj.text}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {aiResult.response && (
                <div className="mt-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-slate-200">
                  <span className="font-semibold text-blue-400 block mb-1">
                    Synthesized Sales Agent Response:
                  </span>
                  <p className="italic text-slate-100">"{aiResult.response}"</p>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Real-time Voice Agent Modal */}
      {isVoiceCallActive && selectedDealId && (
        <VoiceAgentModal
          dealId={selectedDealId}
          dealCompany={displayState.company}
          onClose={() => setIsVoiceCallActive(false)}
          onDealStateUpdated={(updatedState) => setDealState(updatedState)}
        />
      )}
    </div>
  );
}

export default DealState;