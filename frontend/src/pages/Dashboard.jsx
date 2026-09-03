import React from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Users, UserCheck, MessageSquare, TrendingUp, ArrowUpRight, Clock, AlertTriangle } from 'lucide-react';

const stats = [
  { label: 'Active Leads', value: '142', change: '+12.4%', icon: Users, variant: 'primary' },
  { label: 'Qualified Leads', value: '48', change: '+8.1%', icon: UserCheck, variant: 'emerald' },
  { label: 'Active Conversations', value: '18', change: '+24%', icon: MessageSquare, variant: 'purple' },
  { label: 'Conversion Rate', value: '34.2%', change: '+4.5%', icon: TrendingUp, variant: 'amber' },
];

const conversationsDemo = [
  { customer: 'Rohan Sharma', company: 'Nexus Technologies', stage: 'Negotiation', intent: 'High', lastActivity: '5m ago', intentVariant: 'success' },
  { customer: 'Ananya Verma', company: 'Apex Cloud Solutions', stage: 'Discovery', intent: 'Medium', lastActivity: '22m ago', intentVariant: 'warning' },
  { customer: 'Vikram Malhotra', company: 'FinPulse Systems', stage: 'Objection Handling', intent: 'High', lastActivity: '1h ago', intentVariant: 'success' },
  { customer: 'Priya Kapoor', company: 'Global Logistics Inc', stage: 'Demo Requested', intent: 'Very High', lastActivity: '3h ago', intentVariant: 'purple' },
];

export function Dashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Good evening, Welcome to DealPilot"
        subtitle="Your AI-powered sales command center."
      />

      {/* Temporary Notice */}
      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300 flex items-center gap-2">
        <Clock className="w-4 h-4 shrink-0 text-blue-400" />
        <span>Notice: Key performance metrics are temporary UI placeholders until backend analytics endpoints connect in Phase 14.</span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">{stat.label}</span>
                <div className="p-2 rounded-xl bg-slate-800/80 text-blue-400 border border-slate-700/60">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <h3 className="text-2xl font-bold text-white tracking-tight">{stat.value}</h3>
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" />
                  {stat.change}
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Sales Activity Placeholder */}
      <Card title="Sales Activity & Qualification Trends" subtitle="Real-time call volume & conversion metrics visualization container">
        <div className="h-64 rounded-xl border border-dashed border-slate-800 bg-slate-900/40 flex flex-col items-center justify-center p-6 text-center">
          <TrendingUp className="w-10 h-10 text-slate-600 mb-2" />
          <p className="text-sm font-medium text-slate-400">Sales Analytics Chart Visualization Shell</p>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            Visual charts will consume metrics directly from Node.js backend & Python AI Analytics in Phase 12.
          </p>
        </div>
      </Card>

      {/* Recent Conversations */}
      <Card title="Recent Conversations" subtitle="Active voice & messaging sessions across pipeline">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#1f293d] text-slate-400 text-xs uppercase font-semibold">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Company</th>
                <th className="py-3 px-4">Deal Stage</th>
                <th className="py-3 px-4">Intent</th>
                <th className="py-3 px-4 text-right">Last Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f293d]/50">
              {conversationsDemo.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-200">{item.customer}</td>
                  <td className="py-3 px-4 text-slate-400">{item.company}</td>
                  <td className="py-3 px-4">
                    <Badge variant="secondary">{item.stage}</Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={item.intentVariant}>{item.intent}</Badge>
                  </td>
                  <td className="py-3 px-4 text-right text-xs text-slate-400">{item.lastActivity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// src/pages/Conversations.jsx ke end mein:
export default Dashboard;