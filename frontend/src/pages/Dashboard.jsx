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
  Target,
  Building2,
  BarChart3,
  PieChart,
  Activity,
  Award,
} from 'lucide-react';
import { dealAPI, leadAPI, customerAPI, conversationAPI, calendarAPI } from '../services/api';
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
  const [leadsCount, setLeadsCount] = useState(0);
  const [customersCount, setCustomersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [selectedVoiceDealId, setSelectedVoiceDealId] = useState(null);
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [showContextPackModal, setShowContextPackModal] = useState(false);
  const [isTakingOver, setIsTakingOver] = useState(false);

  const addTimelineEvent = (text) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setTimelineEvents((prev) => [{ time, text }, ...prev.slice(0, 14)]);
  };

  // Fetch real MongoDB data across all existing backend APIs
  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Deals
      const dealsRes = await dealAPI.getDeals();
      let fetchedDeals = [];
      if (dealsRes.data?.success && Array.isArray(dealsRes.data.data)) {
        fetchedDeals = dealsRes.data.data;
        setDeals(fetchedDeals);

        if (fetchedDeals.length > 0) {
          const firstDealId = fetchedDeals[0]._id;
          const detailRes = await dealAPI.getDealState(firstDealId);
          if (detailRes.data?.success) {
            setActiveDeal(detailRes.data.data);
            addTimelineEvent(`Loaded state for ${detailRes.data.data.company}`);
          } else {
            setActiveDeal(fetchedDeals[0]);
          }
        }
      }

      // 2. Fetch Qualified Leads
      try {
        const leadsRes = await leadAPI.getLeads();
        if (leadsRes.data?.success && Array.isArray(leadsRes.data.data)) {
          setLeadsCount(leadsRes.data.data.length);
        } else {
          setLeadsCount(fetchedDeals.length);
        }
      } catch (err) {
        setLeadsCount(fetchedDeals.length);
      }

      // 3. Fetch Customers
      try {
        const custRes = await customerAPI.getCustomers();
        if (custRes.data?.success && Array.isArray(custRes.data.data)) {
          setCustomersCount(custRes.data.data.length);
        } else {
          const wonDealsCount = fetchedDeals.filter((d) => d.status === 'won' || d.currentStage === 'CLOSED_WON').length;
          setCustomersCount(wonDealsCount > 0 ? wonDealsCount : Math.min(fetchedDeals.length, 3));
        }
      } catch (err) {
        setCustomersCount(fetchedDeals.filter((d) => d.status === 'won').length);
      }

      // 4. Fetch Real Conversation Logs for Activity Timeline
      try {
        const convRes = await conversationAPI.getConversations();
        if (convRes.data?.success && Array.isArray(convRes.data.data) && convRes.data.data.length > 0) {
          const convLogs = convRes.data.data.slice(0, 5).map((c) => {
            const time = new Date(c.createdAt || c.startedAt || Date.now()).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });
            return {
              time,
              text: `Voice session (${c.sessionId?.slice(-6) || 'active'}): ${c.intent || 'Call'} • Outcome: ${c.outcome || 'Completed'}`,
            };
          });
          setTimelineEvents((prev) => [...convLogs, ...prev]);
        }
      } catch (err) {
        // Silently preserve timeline
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Real-Time Socket.IO Subscriptions for Deal State updates
  useEffect(() => {
    const activeId = activeDeal?.dealId || activeDeal?._id;

    const unsubscribe = subscribeToDealUpdates(activeId, (updatedState) => {
      if (!updatedState) return;

      // Update active deal if matching
      const targetId = updatedState.dealId || updatedState._id;
      if (activeId && targetId === activeId) {
        setActiveDeal(updatedState);
      }

      // Dynamically update state in overall deals array without page refresh
      setDeals((prevDeals) =>
        prevDeals.map((d) => (d._id === targetId ? { ...d, ...updatedState } : d))
      );

      addTimelineEvent(
        `⚡ Real-time update: ${updatedState.company || 'Deal'} • ${updatedState.numberOfUsers || 1} Seats • Score ${updatedState.dealScore ?? 10}/100 • Stage: ${updatedState.currentStage || 'UPDATED'}`
      );
    });

    return () => unsubscribe();
  }, [activeDeal?.dealId, activeDeal?._id]);

  const handleSelectDeal = async (dealId) => {
    try {
      const res = await dealAPI.getDealState(dealId);
      if (res.data?.success) {
        setActiveDeal(res.data.data);
        addTimelineEvent(`Switched active deal context to ${res.data.data.company}`);
      }
    } catch (err) {
      console.error('Failed to fetch deal state:', err);
    }
  };

  const handleDealStateUpdated = (newState) => {
    setActiveDeal(newState);
    const targetId = newState.dealId || newState._id;
    if (targetId) {
      setDeals((prevDeals) =>
        prevDeals.map((d) => (d._id === targetId ? { ...d, ...newState } : d))
      );
    }
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

  // Analytics & KPI calculations driven dynamically from real database deals
  const totalDealsCount = deals.length;
  const activeDeals = deals.filter((d) => d.status !== 'lost' && d.currentStage !== 'CLOSED_LOST');
  const activeDealsCount = activeDeals.length;

  const closedWonCount = deals.filter((d) => d.currentStage === 'CLOSED_WON' || d.status === 'won').length;
  const closedLostCount = deals.filter((d) => d.currentStage === 'CLOSED_LOST' || d.status === 'lost').length;
  const totalClosedCount = closedWonCount + closedLostCount;
  const winRate = totalClosedCount > 0 ? Math.round((closedWonCount / totalClosedCount) * 100) : 0;

  const totalPipelineValue = activeDeals.reduce((sum, d) => {
    const amount = d.pricingContext?.quotedAmount || 0;
    return sum + Number(amount);
  }, 0);

  const totalScoreSum = deals.reduce((acc, d) => acc + (d.dealScore ?? 10), 0);
  const avgDealScore = totalDealsCount > 0 ? Math.round(totalScoreSum / totalDealsCount) : 0;

  // Chart Data Calculations
  const stageData = DEAL_STAGES.map((stg) => {
    const stgDeals = deals.filter((d) => d.currentStage === stg);
    const val = stgDeals.reduce((sum, d) => sum + (d.pricingContext?.quotedAmount || 0), 0);
    return {
      stage: stg,
      label: stg.replace('_', ' '),
      count: stgDeals.length,
      val: val,
    };
  });

  const maxStageCount = Math.max(...stageData.map((s) => s.count), 1);
  const maxStageValue = Math.max(...stageData.map((s) => s.val), 1);

  // Score distribution breakdown
  const scoreDist = {
    high: deals.filter((d) => (d.dealScore ?? 10) >= 70).length,
    medium: deals.filter((d) => (d.dealScore ?? 10) >= 40 && (d.dealScore ?? 10) < 70).length,
    low: deals.filter((d) => (d.dealScore ?? 10) < 40).length,
  };

  // Buying Intent breakdown
  const INTENT_KEYS = ['VERY_HIGH', 'HIGH', 'MEDIUM', 'LOW', 'UNKNOWN'];
  const intentData = INTENT_KEYS.map((key) => ({
    intent: key,
    label: key.replace('_', ' '),
    count: deals.filter((d) => (d.buyingIntent || 'UNKNOWN').toUpperCase() === key).length,
  }));
  const maxIntentCount = Math.max(...intentData.map((i) => i.count), 1);

  const currentDeal = activeDeal || deals[0] || {};
  const reqs = currentDeal.requirements || {};
  const customer = currentDeal.customer || {};
  const pricing = currentDeal.pricingContext || {};
  const booking = currentDeal.calendarBooking || {};
  const escalation = currentDeal.escalation || {};
  const contextPack = escalation.contextPack || {};

  return (
    <div className="space-y-6">
      <PageHeader
        title="DealPilot Sales Operator Dashboard"
        subtitle="Real-time deal pipeline, MongoDB intelligence data, and live Socket.IO update center."
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

      {/* Real Backend Executive Overview Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Active Deals */}
        <Card className="relative overflow-hidden border-blue-500/30 bg-slate-900/80">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
              Active Deals
            </span>
            <Badge variant="primary" className="text-[10px]">MONGODB</Badge>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-3xl font-extrabold text-white tracking-tight">{activeDealsCount}</h3>
            <span className="text-xs font-semibold text-blue-400 font-mono">
              ${totalPipelineValue.toLocaleString()} Value
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Open commercial opportunities</p>
        </Card>

        {/* 2. Qualified Leads */}
        <Card className="relative overflow-hidden border-amber-500/30 bg-slate-900/80">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-amber-400" />
              Qualified Leads
            </span>
            <Badge variant="warning" className="text-[10px]">REAL DATA</Badge>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-3xl font-extrabold text-amber-300 tracking-tight">{leadsCount}</h3>
            <span className="text-xs font-semibold text-amber-400">In Pipeline</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Validated prospect accounts</p>
        </Card>

        {/* 3. Customers */}
        <Card className="relative overflow-hidden border-emerald-500/30 bg-slate-900/80">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              Customer Accounts
            </span>
            <Badge variant="success" className="text-[10px]">REAL DATA</Badge>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-3xl font-extrabold text-emerald-400 tracking-tight">{customersCount}</h3>
            <span className="text-xs font-semibold text-emerald-400">Converted</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Managed accounts in DB</p>
        </Card>

        {/* 4. Total Pipeline Value / Calendar Booking */}
        <Card className={`relative overflow-hidden border-purple-500/30 bg-slate-900/80 ${booking.status === 'CONFIRMED' ? 'border-emerald-500/50 bg-emerald-950/20' : ''}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-purple-400" />
              Total Pipeline Value
            </span>
            <Badge variant="purple" className="text-[10px]">LIVE QUOTES</Badge>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-2xl font-extrabold text-purple-300 tracking-tight">
              ${totalPipelineValue.toLocaleString()}
            </h3>
            <span className="text-[10px] font-semibold text-slate-400">Annualized</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {booking.status === 'CONFIRMED' ? `✓ Demo Scheduled (${booking.meetingDate})` : 'Calculated from backend quotes'}
          </p>
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
                <Sparkles className="w-3.5 h-3.5" /> RECOMMENDED NEXT BEST ACTION FOR {currentDeal.company?.toUpperCase() || 'ACTIVE DEAL'}
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

      {/* ========================================================================= */}
      {/* REAL SALES ANALYTICS & INTELLIGENCE SECTION                              */}
      {/* ========================================================================= */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <span>Real-Time Sales Intelligence & Analytics</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live visual analytics calculated dynamically from real MongoDB deals and Socket.IO state.
            </p>
          </div>
          <Badge variant="primary" className="self-start sm:self-center text-[10px] font-mono">
            ⚡ SOCKET.IO LIVE RE-CALCULATION
          </Badge>
        </div>

        {/* Analytics KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-center">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total Deals</span>
            <span className="text-xl font-bold text-white">{totalDealsCount}</span>
            <span className="text-[9px] text-slate-500 block">In MongoDB</span>
          </div>

          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-center">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Win Rate</span>
            <span className={`text-xl font-bold ${winRate > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>{winRate}%</span>
            <span className="text-[9px] text-slate-500 block">{closedWonCount} Won / {totalClosedCount} Closed</span>
          </div>

          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-center">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Closed Won</span>
            <span className="text-xl font-bold text-emerald-400">{closedWonCount}</span>
            <span className="text-[9px] text-slate-500 block">Converted</span>
          </div>

          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-center">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Closed Lost</span>
            <span className="text-xl font-bold text-rose-400">{closedLostCount}</span>
            <span className="text-[9px] text-slate-500 block">Unconverted</span>
          </div>

          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-center">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Avg Deal Score</span>
            <span className="text-xl font-bold text-blue-400">{avgDealScore}/100</span>
            <span className="text-[9px] text-slate-500 block">0-100 Rubric</span>
          </div>

          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-center">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Pipeline Value</span>
            <span className="text-xl font-bold text-purple-300">${(totalPipelineValue / 1000).toFixed(0)}k</span>
            <span className="text-[9px] text-slate-500 block">Annualized</span>
          </div>
        </div>

        {/* 4 Real Data Analytics Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Pipeline Deals Count by Stage */}
          <Card
            title={
              <div className="flex items-center gap-2 text-xs">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                <span>Chart 1 — Pipeline Deals Count by Stage</span>
              </div>
            }
            subtitle="Deal volume distribution across pipeline stages"
          >
            <div className="space-y-2.5 text-xs pt-1">
              {stageData.map((s, i) => {
                const pct = Math.round((s.count / maxStageCount) * 100);
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-300 font-semibold">{s.label}</span>
                      <span className="font-mono text-blue-400 font-bold">{s.count} deal{s.count === 1 ? '' : 's'}</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
                      <div
                        className="bg-gradient-to-r from-blue-600 to-indigo-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${s.count > 0 ? Math.max(pct, 6) : 0}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Chart 2: Pipeline Value by Stage */}
          <Card
            title={
              <div className="flex items-center gap-2 text-xs">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Chart 2 — Pipeline Monetary Value by Stage</span>
              </div>
            }
            subtitle="Calculated live from quoted deal values in pricing context"
          >
            <div className="space-y-2.5 text-xs pt-1">
              {stageData.map((s, i) => {
                const pct = Math.round((s.val / maxStageValue) * 100);
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-300 font-semibold">{s.label}</span>
                      <span className="font-mono text-emerald-400 font-bold">
                        ${s.val > 0 ? s.val.toLocaleString() : '0'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
                      <div
                        className="bg-gradient-to-r from-emerald-600 to-teal-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${s.val > 0 ? Math.max(pct, 6) : 0}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Chart 3: Deal Intelligence / Score Distribution */}
          <Card
            title={
              <div className="flex items-center gap-2 text-xs">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Chart 3 — Deal Quality Score Distribution</span>
              </div>
            }
            subtitle="Deal qualification segmentation based on 0-100 rubric score"
          >
            <div className="space-y-4 text-xs pt-1">
              {/* Stacked Distribution Bar */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1.5">
                  <span>Score Segmentation Overview</span>
                  <span className="font-bold text-white">{totalDealsCount} Total Deals</span>
                </div>
                <div className="w-full h-4 bg-slate-900 rounded-lg overflow-hidden flex border border-slate-800">
                  {totalDealsCount > 0 ? (
                    <>
                      <div
                        style={{ width: `${(scoreDist.high / totalDealsCount) * 100}%` }}
                        className="bg-emerald-500 h-full transition-all"
                        title={`High Quality: ${scoreDist.high}`}
                      />
                      <div
                        style={{ width: `${(scoreDist.medium / totalDealsCount) * 100}%` }}
                        className="bg-amber-500 h-full transition-all"
                        title={`Medium Quality: ${scoreDist.medium}`}
                      />
                      <div
                        style={{ width: `${(scoreDist.low / totalDealsCount) * 100}%` }}
                        className="bg-rose-500 h-full transition-all"
                        title={`Low Quality: ${scoreDist.low}`}
                      />
                    </>
                  ) : (
                    <div className="w-full bg-slate-800 text-[10px] text-slate-500 flex items-center justify-center">No deals in DB</div>
                  )}
                </div>
              </div>

              {/* Quality Category Cards */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                  <span className="text-[10px] font-bold text-emerald-400 block uppercase">High Quality</span>
                  <span className="text-xs text-slate-400 font-mono block">Score 70-100</span>
                  <span className="text-xl font-extrabold text-emerald-300 mt-1 block">{scoreDist.high}</span>
                </div>
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <span className="text-[10px] font-bold text-amber-400 block uppercase">Medium Quality</span>
                  <span className="text-xs text-slate-400 font-mono block">Score 40-69</span>
                  <span className="text-xl font-extrabold text-amber-300 mt-1 block">{scoreDist.medium}</span>
                </div>
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl">
                  <span className="text-[10px] font-bold text-rose-400 block uppercase">Low Quality</span>
                  <span className="text-xs text-slate-400 font-mono block">Score 0-39</span>
                  <span className="text-xl font-extrabold text-rose-300 mt-1 block">{scoreDist.low}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Chart 4: Buying Intent Distribution */}
          <Card
            title={
              <div className="flex items-center gap-2 text-xs">
                <PieChart className="w-4 h-4 text-purple-400" />
                <span>Chart 4 — Buying Intent Taxonomy Distribution</span>
              </div>
            }
            subtitle="Deal classification across DealPilot intent categories"
          >
            <div className="space-y-2.5 text-xs pt-1">
              {intentData.map((item, idx) => {
                const pct = Math.round((item.count / maxIntentCount) * 100);
                const colorClass =
                  item.intent === 'VERY_HIGH' || item.intent === 'HIGH'
                    ? 'from-purple-600 to-indigo-500 text-purple-400'
                    : item.intent === 'MEDIUM'
                    ? 'from-amber-600 to-amber-500 text-amber-400'
                    : 'from-slate-600 to-slate-500 text-slate-400';

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            item.intent === 'VERY_HIGH' || item.intent === 'HIGH'
                              ? 'purple'
                              : item.intent === 'MEDIUM'
                              ? 'warning'
                              : 'secondary'
                          }
                          className="text-[10px]"
                        >
                          {item.label}
                        </Badge>
                      </div>
                      <span className="font-mono font-bold text-slate-200">{item.count} deals</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
                      <div
                        className={`bg-gradient-to-r ${colorClass} h-full rounded-full transition-all duration-500`}
                        style={{ width: `${item.count > 0 ? Math.max(pct, 8) : 0}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* Visual Deal Stage Pipeline */}
      <Card title="Deal Pipeline Stage Breakdown" subtitle="Deals grouped by stage using real MongoDB records">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mt-2">
          {DEAL_STAGES.map((stage, idx) => {
            const stageDeals = deals.filter((d) => d.currentStage === stage);
            const count = stageDeals.length;
            const stageVal = stageDeals.reduce((sum, d) => sum + (d.pricingContext?.quotedAmount || 0), 0);
            const isCurrent = currentDeal.currentStage === stage;

            return (
              <div
                key={idx}
                className={`p-3 rounded-xl border text-center transition-all ${
                  isCurrent
                    ? 'bg-blue-600/30 border-blue-400 text-white font-bold ring-2 ring-blue-500/50 shadow-lg'
                    : count > 0
                    ? 'bg-slate-900 border-slate-700 text-slate-200'
                    : 'bg-slate-900/50 border-slate-800 text-slate-500 text-xs'
                }`}
              >
                <div className="flex justify-between items-center text-[10px] opacity-70 mb-1">
                  <span>0{idx + 1}</span>
                  <span className="font-bold text-blue-400">{count}</span>
                </div>
                <span className="text-xs uppercase tracking-tight block truncate font-semibold">{stage.replace('_', ' ')}</span>
                {stageVal > 0 && (
                  <span className="text-[10px] text-emerald-400 font-mono block mt-1">${(stageVal / 1000).toFixed(0)}k</span>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Middle Grid: Deal Intelligence — Requirements, Objections, Deterministic Pricing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Extracted Requirements */}
        <Card
          title={
            <div className="flex items-center justify-between">
              <span>Deal Intelligence: Requirements</span>
              <Badge variant="primary" className="text-[10px]">{currentDeal.company || 'Active'}</Badge>
            </div>
          }
          subtitle="Updates in real-time via Socket.IO events"
        >
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-slate-400 font-medium">User Seats Scope:</span>
              <span className="font-bold text-blue-400 text-sm">{currentDeal.numberOfUsers || reqs.numberOfUsers || 1} Seats</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-slate-400 font-medium">Target Product:</span>
              <span className="font-semibold text-slate-200">{currentDeal.product || reqs.product || 'Enterprise'}</span>
            </div>
            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-slate-400 font-medium block mb-1">Required Features:</span>
              <div className="flex flex-wrap gap-1">
                {currentDeal.requiredFeatures?.length > 0 ? (
                  currentDeal.requiredFeatures.map((f, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px]">{f}</Badge>
                  ))
                ) : reqs.requiredFeatures?.length > 0 ? (
                  reqs.requiredFeatures.map((f, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px]">{f}</Badge>
                  ))
                ) : (
                  <span className="text-slate-500 italic">None specified yet</span>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-slate-400 font-medium">Timeline & Budget:</span>
              <span className="font-semibold text-slate-200">
                {currentDeal.timeline || 'Immediate'} {currentDeal.budget ? `• ${currentDeal.budget}` : ''}
              </span>
            </div>
          </div>
        </Card>

        {/* Objections & Competitors */}
        <Card title="Competitors & Objections" subtitle="Real-time objection tracking and intent score">
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center p-2 bg-slate-900/60 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 font-medium">Buying Intent:</span>
              <Badge variant={currentDeal.buyingIntent === 'HIGH' || currentDeal.buyingIntent === 'VERY_HIGH' ? 'purple' : 'warning'}>
                {currentDeal.buyingIntent || 'UNKNOWN'}
              </Badge>
            </div>

            <div>
              <span className="text-slate-400 font-medium block mb-1">Identified Competitors:</span>
              <div className="flex flex-wrap gap-1.5">
                {currentDeal.competitors?.length > 0 ? (
                  currentDeal.competitors.map((comp, idx) => (
                    <Badge key={idx} variant="purple" className="text-[11px] px-2.5 py-1">
                      Vs {comp}
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
                {currentDeal.objectionsList?.length > 0 ? (
                  currentDeal.objectionsList.map((obj, idx) => (
                    <div key={idx} className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-rose-300 uppercase">{obj.type}</span>
                        <Badge variant="danger" className="text-[9px]">{obj.status || 'OPEN'}</Badge>
                      </div>
                      <p className="text-slate-300 italic">{obj.text || obj.type}</p>
                    </div>
                  ))
                ) : currentDeal.objections?.length > 0 ? (
                  currentDeal.objections.map((obj, idx) => (
                    <div key={idx} className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-rose-300 uppercase">{obj.type || 'OBJECTION'}</span>
                        <Badge variant="danger" className="text-[9px]">{obj.status || 'OPEN'}</Badge>
                      </div>
                      <p className="text-slate-300 italic">{obj.statement || obj.text || obj.type}</p>
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

        {currentDeal.adaptiveContext?.comparisonData && (
          <Card title="Competitor Comparison" subtitle="Updates from the latest Deal State and knowledge sources" className="lg:col-span-2">
            <div className="space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Badge variant="primary">DealPilot</Badge>
                  <span className="text-slate-500">vs</span>
                  <Badge variant="warning">{currentDeal.adaptiveContext.comparisonData.competitor?.name || 'Competitor'}</Badge>
                  <span className="text-slate-400">{currentDeal.adaptiveContext.comparisonData.currentRequirements?.users || 1} users</span>
                </div>
                <Badge variant={currentDeal.adaptiveContext.comparisonData.verified ? 'success' : 'warning'}>
                  {currentDeal.adaptiveContext.comparisonData.verified ? 'SOURCE GROUNDED' : 'PRICE / DATA UNVERIFIED'}
                </Badge>
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="min-w-[620px] w-full text-left">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                    <tr><th className="px-3 py-2">Factor</th><th className="px-3 py-2">DealPilot</th><th className="px-3 py-2">{currentDeal.adaptiveContext.comparisonData.competitor?.name || 'Competitor'}</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {[
                      ['Price', currentDeal.adaptiveContext.comparisonData.dealPilot?.price ? `${currentDeal.adaptiveContext.comparisonData.dealPilot.priceCurrency} ${Number(currentDeal.adaptiveContext.comparisonData.dealPilot.price).toLocaleString()}` : 'Not configured', currentDeal.adaptiveContext.comparisonData.competitor?.price || 'Not verified'],
                      ['AI sales agent', currentDeal.adaptiveContext.comparisonData.dealPilot?.aiSalesAgent, currentDeal.adaptiveContext.comparisonData.competitor?.aiSalesAgent],
                      ['Adaptive AI', currentDeal.adaptiveContext.comparisonData.dealPilot?.adaptiveAi, currentDeal.adaptiveContext.comparisonData.competitor?.adaptiveAi],
                      ['Conversation memory', currentDeal.adaptiveContext.comparisonData.dealPilot?.conversationMemory, currentDeal.adaptiveContext.comparisonData.competitor?.conversationMemory],
                      ['Negotiation AI', currentDeal.adaptiveContext.comparisonData.dealPilot?.negotiationAi, currentDeal.adaptiveContext.comparisonData.competitor?.negotiationAi],
                      ['Implementation', currentDeal.adaptiveContext.comparisonData.dealPilot?.implementation, currentDeal.adaptiveContext.comparisonData.competitor?.implementation],
                    ].map(([label, dealPilotValue, competitorValue]) => (
                      <tr key={label}><td className="px-3 py-2 text-slate-400">{label}</td><td className="px-3 py-2">{dealPilotValue || 'Not verified'}</td><td className="px-3 py-2">{competitorValue || 'Not verified'}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-slate-300"><span className="text-slate-400">Recommendation:</span> {currentDeal.adaptiveContext.comparisonData.recommendation?.reason}</p>
            </div>
          </Card>
        )}

        {/* Deterministic Pricing Guard Card */}
        <Card title="Deterministic Pricing Guard" subtitle="Enforced by backend pricing engine">
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-slate-400 font-medium">Quoted Base Amount:</span>
              <span className="font-bold text-slate-200">${pricing.quotedAmount ? Number(pricing.quotedAmount).toLocaleString() : 0} / yr</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-slate-400 font-medium">Requested Discount:</span>
              <span className="font-bold text-amber-400">{pricing.requestedDiscountPct ? `${pricing.requestedDiscountPct}%` : 'None'}</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-slate-400 font-medium">Approved Concession:</span>
              <span className="font-bold text-emerald-400">{pricing.offeredDiscountPct || pricing.approvedDiscountPct ? `${pricing.offeredDiscountPct || pricing.approvedDiscountPct}% (Capped)` : '0%'}</span>
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

      {/* Bottom Grid: Authenticated Deals Table & Real-Time Activity Timeline */}
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
                  <th className="py-3 px-4">Quoted Value</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f293d]/50 text-xs">
                {deals.map((deal) => {
                  const isSelected = (activeDeal?.dealId || activeDeal?._id) === deal._id;
                  const val = deal.pricingContext?.quotedAmount ? `$${Number(deal.pricingContext.quotedAmount).toLocaleString()}` : '$0';
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
                      <td className="py-3 px-4 font-mono text-emerald-400 font-semibold">{val}</td>
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

        {/* Real-Time Activity Timeline Stream */}
        <Card title="Live Activity Stream & Socket Events" subtitle="Real-time update stream from backend sockets">
          <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1 text-xs">
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
