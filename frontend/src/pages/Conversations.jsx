import React from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { MessageSquare } from 'lucide-react';

const logsDemo = [
  { id: 'CONV-8821', customer: 'Rohan Sharma', date: '2026-09-01', duration: '4m 12s', intent: 'High', outcome: 'Demo Scheduled' },
  { id: 'CONV-8820', customer: 'Ananya Verma', date: '2026-09-01', duration: '6m 45s', intent: 'Medium', outcome: 'Follow-up Email Sent' },
  { id: 'CONV-8819', customer: 'Vikram Malhotra', date: '2026-08-31', duration: '9m 10s', intent: 'High', outcome: 'Escalated to Human Sales' },
];

export function Conversations() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Conversation Logs"
        subtitle="Complete transcript archive and voice interaction history."
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#1f293d] text-slate-400 text-xs uppercase font-semibold">
                <th className="py-3 px-4">Session ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Intent</th>
                <th className="py-3 px-4 text-right">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f293d]/50">
              {logsDemo.map((log, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-mono text-xs text-blue-400">{log.id}</td>
                  <td className="py-3 px-4 font-medium text-slate-200 flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                    {log.customer}
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-xs">{log.date}</td>
                  <td className="py-3 px-4 text-slate-400 text-xs">{log.duration}</td>
                  <td className="py-3 px-4">
                    <Badge variant={log.intent === 'High' ? 'success' : 'warning'}>{log.intent}</Badge>
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-slate-300">{log.outcome}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}