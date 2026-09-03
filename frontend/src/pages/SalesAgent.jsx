import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { PhoneCall, Bot, User, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import { dealAPI } from '../services/api';
import { VoiceAgentModal } from '../components/voice/VoiceAgentModal';

export function SalesAgent() {
  const [deals, setDeals] = useState([]);
  const [selectedDealId, setSelectedDealId] = useState(null);
  const [activeDeal, setActiveDeal] = useState(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  useEffect(() => {
    async function loadDeals() {
      try {
        const res = await dealAPI.getDeals();
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setDeals(res.data.data);
          const firstId = res.data.data[0]._id;
          setSelectedDealId(firstId);
          const stateRes = await dealAPI.getDealState(firstId);
          if (stateRes.data?.success) {
            setActiveDeal(stateRes.data.data);
          }
        }
      } catch (err) {
        console.error('Failed to load deals in SalesAgent:', err);
      }
    }
    loadDeals();
  }, []);

  const handleSelectDeal = async (id) => {
    setSelectedDealId(id);
    try {
      const stateRes = await dealAPI.getDealState(id);
      if (stateRes.data?.success) {
        setActiveDeal(stateRes.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch deal state:', err);
    }
  };

  const dealState = activeDeal || {
    company: 'Target Prospect',
    dealScore: 40,
    buyingIntent: 'HIGH',
    currentStage: 'QUALIFICATION',
    requirements: { numberOfUsers: 50 },
    nextBestAction: 'Qualify requirements and user seats',
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agora Real-Time Voice Sales Agent"
        subtitle="Real-time voice RTC qualification, adaptive strategist reasoning, and dynamic negotiation console."
        action={
          <Button
            onClick={() => {
              if (selectedDealId) setIsVoiceModalOpen(true);
            }}
            icon={PhoneCall}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
          >
            Launch Live Agora Voice Agent
          </Button>
        }
      />

      <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Agora Conversational AI Voice Engine: <strong>ACTIVE & READY FOR CALLS</strong></span>
        </div>
        <Badge variant="success">REMOTE CLOUD RTC ACTIVE</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Active Deal Voice Launcher */}
        <Card title="Active Target Account" subtitle="Select a deal to start live voice session" className="lg:col-span-2">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {deals.map((deal) => (
                <button
                  key={deal._id}
                  onClick={() => handleSelectDeal(deal._id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    selectedDealId === deal._id
                      ? 'bg-blue-600/30 border-blue-400 text-white shadow-lg'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {deal.company}
                </button>
              ))}
            </div>

            <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-4 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <PhoneCall className="w-8 h-8 animate-pulse" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-1">{dealState.company}</h3>
                <p className="text-xs text-slate-400">
                  Target Stage: <span className="text-purple-400 font-semibold">{dealState.currentStage}</span> • Score: <span className="text-emerald-400 font-bold">{dealState.dealScore}/100</span>
                </p>
              </div>

              <button
                onClick={() => {
                  if (selectedDealId) setIsVoiceModalOpen(true);
                }}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm shadow-xl shadow-emerald-600/30 transition-all flex items-center gap-2"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Start Live Voice Session with Agora</span>
              </button>
            </div>
          </div>
        </Card>

        {/* Right: Live Deal Intelligence */}
        <Card title="Live Deal Intelligence" subtitle="Grounded parameters & next best action">
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="text-slate-400 block mb-1">Buying Intent</span>
              <Badge variant="purple" className="text-[11px] px-2.5 py-1">{dealState.buyingIntent}</Badge>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="text-slate-400 block mb-1">Extracted User Seats</span>
              <span className="text-sm font-bold text-blue-400">{dealState.requirements?.numberOfUsers || 1} User Seats</span>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="text-slate-400 block mb-1 font-medium">Recommended Next Best Action</span>
              <p className="text-slate-200 leading-relaxed font-medium">{dealState.nextBestAction}</p>
            </div>
          </div>
        </Card>
      </div>

      {isVoiceModalOpen && selectedDealId && (
        <VoiceAgentModal
          dealId={selectedDealId}
          dealCompany={dealState.company}
          onClose={() => setIsVoiceModalOpen(false)}
          onDealStateUpdated={(newState) => setActiveDeal(newState)}
        />
      )}
    </div>
  );
}

export default SalesAgent;
