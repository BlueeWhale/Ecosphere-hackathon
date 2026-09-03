import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  Users,
  MessageSquare,
  TrendingUp,
  ArrowUpRight,
  Clock,
  PhoneCall,
  BrainCircuit,
  Zap,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  DollarSign,
  Radio,
  Calendar,
  UserCheck,
  FileText,
  X,
} from 'lucide-react';
import { dealAPI, calendarAPI } from '../services/api';
import { subscribeToDealUpdates } from '../services/socketClient';
import { VoiceAgentModal } from '../components/voice/VoiceAgentModal';

const DEAL_STAGES = [
  'NEW',
  'QUALIFICATION',
  'DISCOVERY',
  'EVALUATION',
  'NEGOTIATION',
  'DEMO_REQUESTED',
  'CLOSED_WON',
  'CLOSED_LOST',
];

export function Dashboard() {
  const [deals, setDeals] = useState([]);
  const [activeDeal, setActiveDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [selectedVoiceDealId, setSelectedVoiceDealId] = useState(null);
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [showContextPackModal, setShowContextPackModal] = useState(false);
  const [isTakingOver, setIsTakingOver] = useState(false);

  // Fetch real MongoDB deals for authenticated user
  const fetchDeals = async () => {
    try {
      setLoading(true);
      const res = await dealAPI.getDeals();
      if (res.data?.success && Array.isArray(res.data.data)) {
        const fetched = res.data.data;
        setDeals(fetched);
        if (fetched.length > 0) {
          const firstDealId = fetched[0]._id;
          const detailRes = await dealAPI.getDealState(firstDealId);
          if (detailRes.data?.success) {
            setActiveDeal(detailRes.data.data);
            addTimelineEvent(`Loaded live state for ${detailRes.data.data.company}`);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load deals for dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  // Real-Time Socket.IO Subscriptions
  useEffect(() => {
    if (!activeDeal?.dealId && !activeDeal?._id) return;
    const dealId = activeDeal.dealId || activeDeal._id;

    const unsubscribe = subscribeToDealUpdates(dealId, (updatedState) => {
      setActiveDeal(updatedState);
      addTimelineEvent(`Real-time update: Score ${updatedState.dealScore}/100 • Stage: ${updatedState.currentStage}`);
    });

    return () => unsubscribe();
  }, [activeDeal?.dealId, activeDeal?._id]);

  const addTimelineEvent = (text) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setTimelineEvents((prev) => [{ time, text }, ...prev.slice(0, 9)]);
  };

  const handleSelectDeal = async (dealId) => {
    try {
      const res = await dealAPI.getDealState(dealId);
      if (res.data?.success) {
        setActiveDeal(res.data.data);
        addTimelineEvent(`Switched active view to ${res.data.data.company}`);
      }
    } catch (err) {
      console.error('Failed to fetch deal state:', err);
    }
  };

  const handleDealStateUpdated = (newState) => {
    setActiveDeal(newState);
    addTimelineEvent(`Live Call Event: State merged for ${newState.company || 'deal'}`);
  };

  const handleHumanTakeover = async () => {
    const dealId = activeDeal?.dealId || activeDeal?._id;
    if (!dealId) return;

    try {
      setIsTakingOver(true);
      const res = await calendarAPI.takeoverDeal({ dealId });
      if (res.data?.success && res.data.data?.dealState) {
        setActiveDeal(res.data.data.dealState);
        addTimelineEvent(`HUMAN TAKEOVER CONNECTED: Sales rep connected to ${activeDeal.company}`);
      }
    } catch (err) {
      console.error('Failed to take over deal:', err);
    } finally {
      setIsTakingOver(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
        <Radio className="w-8 h-8 text-blue-400 animate-spin mb-3" />
        <p className="text-sm font-medium">Connecting to DealPilot Real-Time Sales Intelligence...</p>
      </div>
    );
  }

  const currentDeal = activeDeal || {};
  const reqs = currentDeal.requirements || {};
  const customer = currentDeal.customer || {};
  const pricing = currentDeal.pricingContext || {};
  const booking = currentDeal.calendarBooking || {};
  const escalation = currentDeal.escalation || {};
  const contextPack = escalation.contextPack || {};

  return (
    <div className="space-y-6">
      <PageHeader
        title="DealPilot Action Command Center"
        subtitle="Real-time sales intelligence, Google Calendar booking, and Human Escalation workflow."
        action={
          <Button
            onClick={() => {
              if (currentDeal.dealId || currentDeal._id) {
                setSelectedVoiceDealId(currentDeal.dealId || currentDeal._id);
                setIsVoiceModalOpen(true);
              }
            }}
            icon={PhoneCall}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
          >
            Start Real-Time Voice Call
          </Button>
        }
      />

      {/* HUMAN ESCALATION ALERT BANNER */}
      {escalation.status === 'ESCALATION_REQUESTED' && (
        <div className="p-4 bg-rose-500/15 border-2 border-rose-500/50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 shrink-0">
              <AlertTriangle className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-white text-sm">⚠ HUMAN ASSISTANCE REQUIRED</h4>
                <Badge variant="danger" className="text-[10px]">REASON: {escalation.reason || 'Approval Limit Exceeded'}</Badge>
              </div>
              <p className="text-xs text-rose-200 mt-0.5">
                Target Account: <strong className="text-white">{currentDeal.company}</strong> • Deal Score: <strong className="text-emerald-400">{currentDeal.dealScore}/100</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => setShowContextPackModal(true)}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>View Context Pack</span>
            </button>
            <button
              onClick={handleHumanTakeover}
              disabled={isTakingOver}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-rose-600/30 flex items-center gap-1.5 transition-colors"
            >
              <UserCheck className="w-4 h-4" />
              <span>{isTakingOver ? 'Connecting...' : 'Take Over Call'}</span>
            </button>
          </div>
        </div>
      )}

      {/* HUMAN CONNECTED BADGE */}
      {escalation.status === 'HUMAN_CONNECTED' && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Human Sales Representative Active in Live Call with <strong>{currentDeal.company}</strong></span>
          </div>
          <Badge variant="success" className="text-[10px]">HUMAN CONNECTED</Badge>
        </div>
      )}

      {/* Top Real-Time Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden border-blue-500/30 bg-slate-900/80">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Active Customer</span>
            <Badge variant="primary" className="text-[10px]">REAL MONGODB</Badge>
          </div>
          <div className="mt-2">
            <h3 className="text-lg font-bold text-white tracking-tight">{currentDeal.company || 'No Active Deal'}</h3>
            <p className="text-xs text-slate-400">{customer.name ? `${customer.name} (${customer.role || 'Decision Maker'})` : 'Select a deal below'}</p>
          </div>
        </Card>

        <Card className="relative overflow-hidden border-emerald-500/30 bg-slate-900/80">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Deal Score</span>
            <Badge variant="success" className="text-[10px] font-mono">0 - 100 RUBRIC</Badge>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-3xl font-extrabold text-emerald-400">{currentDeal.dealScore ?? 10}<span className="text-xs text-slate-500">/100</span></h3>
            <span className="text-xs font-semibold text-emerald-400">Deterministic</span>
          </div>
        </Card>

        <Card className="relative overflow-hidden border-purple-500/30 bg-slate-900/80">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Buying Intent</span>
            <Badge variant={currentDeal.buyingIntent === 'HIGH' || currentDeal.buyingIntent === 'VERY_HIGH' ? 'purple' : 'warning'} className="text-[10px]">
              {currentDeal.buyingIntent || 'UNKNOWN'}
            </Badge>
          </div>
          <div className="mt-2">
            <h3 className="text-lg font-bold text-purple-300">{currentDeal.buyingIntent || 'UNKNOWN'}</h3>
            <p className="text-xs text-slate-400">Gemini Intent Detection</p>
          </div>
        </Card>

        {/* DEMO SCHEDULED / CALENDAR BOOKING CARD */}
        <Card className={`relative overflow-hidden border-slate-800 bg-slate-900/80 ${booking.status === 'CONFIRMED' ? 'border-emerald-500/50 bg-emerald-950/20' : ''}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Calendar Status</span>
            <Badge variant={booking.status === 'CONFIRMED' ? 'success' : 'secondary'} className="text-[10px]">
              {booking.status === 'CONFIRMED' ? '✓ DEMO SCHEDULED' : 'NO MEETING'}
            </Badge>
          </div>
          <div className="mt-2">
            {booking.status === 'CONFIRMED' ? (
              <div>
                <h3 className="text-sm font-bold text-emerald-300 truncate">{booking.summary || 'Enterprise Demo'}</h3>
                <p className="text-xs text-slate-300 font-mono mt-0.5">
                  {booking.meetingDate} • {booking.meetingTime} ({booking.durationMinutes}m)
                </p>
              </div>
            ) : (
              <div>
                <h3 className="text-sm font-bold text-slate-300">No Demo Booked</h3>
                <p className="text-xs text-slate-500">Google Calendar integration active</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Prominent Next Best Action Recommendation */}
      <Card className="border-2 border-blue-500/40 bg-slate-950/80 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 shrink-0">
            <Zap className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> RECOMMENDED NEXT BEST ACTION
              </span>
              <Badge variant="outline" className="text-[10px]">Engine: nextBestActionService</Badge>
            </div>
            <h4 className="text-base font-bold text-white mb-1">
              {currentDeal.nextBestAction || 'Qualify timeline and user seat count.'}
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Reason: {currentDeal.nextBestActionReason || 'Based on active stage and requirements analysis.'}
            </p>
          </div>
        </div>
      </Card>

      {/* Visual Deal Stage Pipeline */}
      <Card title="Visual Deal Stage Pipeline" subtitle={`Current Stage: ${currentDeal.currentStage || 'NEW'}`}>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mt-2">
          {DEAL_STAGES.map((stage, idx) => {
            const isCurrent = currentDeal.currentStage === stage;
            return (
              <div
                key={idx}
                className={`p-3 rounded-xl border text-center transition-all ${
                  isCurrent
                    ? 'bg-blue-600/30 border-blue-400 text-white font-bold ring-2 ring-blue-500/50 shadow-lg'
                    : 'bg-slate-900 border-slate-800 text-slate-500 text-xs'
                }`}
              >
                <span className="text-[10px] block opacity-60">0{idx + 1}</span>
                <span className="text-xs uppercase tracking-tight block truncate">{stage}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Middle Grid: Requirements, Objections, Pricing, Score Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Extracted Customer Requirements */}
        <Card title="Live Extracted Requirements" subtitle="Updates live without page refresh">
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-slate-400 font-medium">User Seat Scope:</span>
              <span className="font-bold text-blue-400 text-sm">{reqs.numberOfUsers || 1} Seats</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-slate-400 font-medium">Target Product:</span>
              <span className="font-semibold text-slate-200">{reqs.product || 'Enterprise'}</span>
            </div>
            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-slate-400 font-medium block mb-1">Required Features:</span>
              <div className="flex flex-wrap gap-1">
                {reqs.requiredFeatures?.length > 0 ? (
                  reqs.requiredFeatures.map((f, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px]">{f}</Badge>
                  ))
                ) : (
                  <span className="text-slate-500 italic">None specified yet</span>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-slate-400 font-medium">Timeline:</span>
              <span className="font-semibold text-slate-200">{reqs.timeline || 'Immediate'}</span>
            </div>
          </div>
        </Card>

        {/* Competitors & Active Objections */}
        <Card title="Competitors & Objections" subtitle="Real-time objection tracking">
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 font-medium block mb-1">Identified Competitors:</span>
              <div className="flex flex-wrap gap-1.5">
                {currentDeal.competitors?.length > 0 ? (
                  currentDeal.competitors.map((comp, idx) => (
                    <Badge key={idx} variant="purple" className="text-[11px] px-2.5 py-1">
                      {comp}
                    </Badge>
                  ))
                ) : (
                  <span className="text-slate-500 italic">No competitors mentioned</span>
                )}
              </div>
            </div>

            <div>
              <span className="text-slate-400 font-medium block mb-1">Active Objections:</span>
              <div className="space-y-2">
                {currentDeal.objections?.length > 0 ? (
                  currentDeal.objections.map((obj, idx) => (
                    <div key={idx} className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-rose-300 uppercase">{obj.type}</span>
                        <Badge variant="danger" className="text-[9px]">{obj.status || 'OPEN'}</Badge>
                      </div>
                      <p className="text-slate-300 italic">{obj.statement || obj.type}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>No active commercial objections detected</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Deterministic Pricing Guard Card */}
        <Card title="Deterministic Pricing Guard" subtitle="Enforced by backend pricing engine">
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-slate-400 font-medium">Quoted Base Amount:</span>
              <span className="font-bold text-slate-200">${pricing.quotedAmount || 0} / yr</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-slate-400 font-medium">Requested Discount:</span>
              <span className="font-bold text-amber-400">{pricing.requestedDiscountPct ? `${pricing.requestedDiscountPct}%` : 'None'}</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-slate-400 font-medium">Approved Concession:</span>
              <span className="font-bold text-emerald-400">{pricing.offeredDiscountPct ? `${pricing.offeredDiscountPct}% (Capped)` : '0%'}</span>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-400 font-medium">Policy Approval Status:</span>
                <Badge variant={pricing.policyStatus === 'REQUIRES_APPROVAL' ? 'danger' : 'success'} className="text-[10px]">
                  {pricing.policyStatus || 'APPROVED'}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-400">
                {pricing.policyStatus === 'REQUIRES_APPROVAL'
                  ? 'Concession request exceeds 25% policy limit. Automatically routed to VP Sales.'
                  : 'Pricing complies with standard discount boundaries.'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom Grid: Available Deals Table & Real-Time Conversation Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deal Selector Table */}
        <Card title="Authenticated User Deals" subtitle="Select a deal to inspect or start voice session" className="lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#1f293d] text-slate-400 text-xs uppercase font-semibold">
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Seats</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f293d]/50 text-xs">
                {deals.map((deal) => {
                  const isSelected = (activeDeal?.dealId || activeDeal?._id) === deal._id;
                  return (
                    <tr
                      key={deal._id}
                      onClick={() => handleSelectDeal(deal._id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-600/20 text-white font-medium' : 'hover:bg-slate-800/40 text-slate-300'
                      }`}
                    >
                      <td className="py-3 px-4 font-bold text-white">{deal.company}</td>
                      <td className="py-3 px-4">{deal.customerName || 'N/A'}</td>
                      <td className="py-3 px-4 font-semibold text-blue-400">{deal.numberOfUsers || 1}</td>
                      <td className="py-3 px-4 font-bold text-emerald-400">{deal.dealScore ?? 10}/100</td>
                      <td className="py-3 px-4">
                        <Badge variant="purple" className="text-[10px]">{deal.currentStage}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedVoiceDealId(deal._id);
                            setIsVoiceModalOpen(true);
                          }}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-[11px] transition-colors"
                        >
                          Voice Call
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Real-Time Conversation Activity Timeline */}
        <Card title="Live Conversation Activity Timeline" subtitle="Real-time socket event stream">
          <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1 text-xs">
            {timelineEvents.length > 0 ? (
              timelineEvents.map((evt, idx) => (
                <div key={idx} className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl flex items-start gap-2.5">
                  <span className="font-mono text-[10px] text-blue-400 shrink-0 mt-0.5">{evt.time}</span>
                  <p className="text-slate-300 leading-snug">{evt.text}</p>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-slate-500 italic">No real-time events recorded yet</div>
            )}
          </div>
        </Card>
      </div>

      {/* CONTEXT PACK MODAL */}
      {showContextPackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <span>Human Escalation Context Pack</span>
              </h3>
              <button onClick={() => setShowContextPackModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <span className="text-slate-400 block font-medium">Escalation Reason:</span>
                <span className="text-rose-400 font-semibold">{contextPack.escalationReason || escalation.reason || 'Pricing limit exceeded'}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-slate-400 block">Customer:</span>
                  <span className="text-slate-200 font-bold">{contextPack.customerName || currentDeal.customerName}</span>
                </div>
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-slate-400 block">Deal Score:</span>
                  <span className="text-emerald-400 font-bold">{contextPack.dealScore || currentDeal.dealScore}/100</span>
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <span className="text-slate-400 block font-medium mb-1">Latest Customer Message:</span>
                <p className="text-slate-200 italic">"{contextPack.latestCustomerMessage || 'Can you give us 40% discount?'}"</p>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <span className="text-slate-400 block font-medium mb-1">Conversation Context Summary:</span>
                <p className="text-slate-300 leading-relaxed">{contextPack.conversationSummary || 'Customer requested pricing concession beyond policy limit.'}</p>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <span className="text-slate-400 block font-medium mb-1">Recommended Action:</span>
                <p className="text-blue-300 font-semibold">{contextPack.nextBestAction || currentDeal.nextBestAction}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowContextPackModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowContextPackModal(false);
                  handleHumanTakeover();
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl"
              >
                Take Over Call Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voice Agent Modal */}
      {isVoiceModalOpen && selectedVoiceDealId && (
        <VoiceAgentModal
          dealId={selectedVoiceDealId}
          dealCompany={activeDeal?.company}
          onClose={() => setIsVoiceModalOpen(false)}
          onDealStateUpdated={handleDealStateUpdated}
        />
      )}
    </div>
  );
}

export default Dashboard;
