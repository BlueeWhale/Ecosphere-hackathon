import React from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { MicOff, PhoneOff, AlertCircle, Bot, User, Cpu, Sparkles, Activity } from 'lucide-react';

export function SalesAgent() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Sales Agent"
        subtitle="Real-time voice qualification and dynamic negotiation console."
      />

      {/* Phase notice banner */}
      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
        <div>
          <span className="font-semibold">Voice Engine Offline (Phase 2):</span> Voice RTC, Speech-to-Text, and Text-to-Speech integrations will be enabled in Phase 10 & 11. Current view presents the workspace interface layout.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Center: Live Conversation */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="flex flex-col h-[560px]">
            {/* Call Status Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-[#1f293d]">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">Call Status: Standby</h4>
                  <p className="text-xs text-slate-400">Target Customer: Rohan Sharma (Nexus Tech)</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" icon={MicOff} disabled>
                  Mute
                </Button>
                <Button variant="danger" size="sm" icon={PhoneOff} disabled>
                  End Call
                </Button>
              </div>
            </div>

            {/* Live Transcript Area Placeholder */}
            <div className="flex-1 my-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 overflow-y-auto space-y-4">
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider">DealPilot AI</span>
                  <div className="p-3 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-xs text-slate-200">
                    Hello Rohan! Thank you for speaking with DealPilot today. I understand you're looking to upgrade your team's workflow automation software. Could you tell me how many users you plan to onboard?
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <div className="space-y-1 text-right">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Customer</span>
                  <div className="p-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs text-slate-200 text-left">
                    We currently have 50 sales agents needing access, but competitor pricing came in lower than your published rates.
                  </div>
                </div>
                <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Input Bar Placeholder */}
            <div className="pt-2 border-t border-[#1f293d] flex items-center gap-2">
              <input
                type="text"
                disabled
                placeholder="Voice channel active... (Manual text input disabled during call)"
                className="flex-1 bg-slate-900 border border-slate-800 text-xs text-slate-500 rounded-xl px-4 py-2.5 cursor-not-allowed"
              />
              <Button variant="primary" size="sm" disabled icon={Sparkles}>
                Send
              </Button>
            </div>
          </Card>
        </div>

        {/* Right: Deal Intelligence Panel */}
        <div className="space-y-4">
          <Card title="Deal Intelligence" subtitle="Live extracted parameters & state">
            <div className="space-y-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-1">Buying Intent</span>
                <Badge variant="success">High Intent (88%)</Badge>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Current Deal Stage</span>
                <Badge variant="purple">Negotiation & Pricing</Badge>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Extracted Requirements</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  <Badge variant="secondary">50 User Seats</Badge>
                  <Badge variant="secondary">API Integration</Badge>
                  <Badge variant="secondary">24/7 Support</Badge>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Detected Objections</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  <Badge variant="danger">Competitor Price Comparison</Badge>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-1">
                <div className="flex items-center gap-1.5 text-blue-400 font-semibold">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Recommended Next Action</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Offer Tier-2 Enterprise Volume Discount with annual commitment requirement.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}