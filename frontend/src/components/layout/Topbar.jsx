import React from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Bell, Menu, ShieldCheck, Activity } from 'lucide-react';

const routeTitles = {
  '/dashboard': 'Sales Command Center',
  '/sales-agent': 'AI Sales Agent (Voice Engine)',
  '/leads': 'Lead Pipeline',
  '/customers': 'Customer Accounts',
  '/conversations': 'Conversation Logs',
  '/deal-state': 'Dynamic Deal Intelligence',
  '/products': 'Product Catalog & Pricing',
  '/knowledge-base': 'RAG Knowledge Documents',
  '/calendar': 'Calendar & Demo Schedules',
  '/follow-ups': 'Follow-Up Queue',
  '/analytics': 'Sales Performance & Intent Analytics',
  '/integrations': 'System Integrations & API Hub',
  '/settings': 'System Settings & Preferences',
};

export function Topbar({ setMobileOpen }) {
  const location = useLocation();
  const title = routeTitles[location.pathname] || 'DealPilot Console';

  return (
    <header className="h-16 bg-[#0b0f17]/80 backdrop-blur-md border-b border-[#1f293d] sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg bg-[#131b2e] border border-[#1f293d]"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-white tracking-wide">{title}</h2>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              UI Shell Ready
            </span>
            <span>•</span>
            <span className="text-slate-400">Phase 2 Mode</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Search Bar */}
        <div className="relative hidden md:block w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search leads, deals, logs..."
            className="w-full bg-[#131b2e] border border-[#1f293d] text-xs text-slate-200 placeholder-slate-500 rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* System Health Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#131b2e] border border-[#1f293d] text-xs text-slate-300">
          <Activity className="w-3.5 h-3.5 text-blue-400" />
          <span>API: 5000 / 8000</span>
        </div>

        {/* Notifications Icon */}
        <button className="p-2 text-slate-400 hover:text-white rounded-xl bg-[#131b2e] border border-[#1f293d] relative transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500"></span>
        </button>
      </div>
    </header>
  );
}