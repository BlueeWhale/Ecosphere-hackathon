import React from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Plus, Search, Filter, MoreHorizontal } from 'lucide-react';

const leadsDemo = [
  { name: 'Karan Mehta', company: 'Zenith Labs', email: 'karan@zenithlabs.io', intent: 'High', score: 92, stage: 'Qualified', status: 'Active' },
  { name: 'Sneha Reddy', company: 'HyperScale AI', email: 'sneha@hyperscale.ai', intent: 'Medium', score: 68, stage: 'Discovery', status: 'New' },
  { name: 'Rahul Singhania', company: 'Veritas Corp', email: 'rahul@veritas.com', intent: 'High', score: 85, stage: 'Negotiation', status: 'Active' },
  { name: 'Meera Nambiar', company: 'Starlight Tech', email: 'meera@starlight.io', intent: 'Low', score: 41, stage: 'Qualification', status: 'Unqualified' },
];

export function Leads() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads Pipeline"
        subtitle="Manage lead qualification statuses and intent scoring."
        action={<Button icon={Plus}>Add Lead</Button>}
      />

      <Card>
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4 justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search leads..."
              className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>
          <Button variant="secondary" size="sm" icon={Filter}>
            Filter Pipeline
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#1f293d] text-slate-400 text-xs uppercase font-semibold">
                <th className="py-3 px-4">Lead Name</th>
                <th className="py-3 px-4">Company</th>
                <th className="py-3 px-4">Score</th>
                <th className="py-3 px-4">Intent</th>
                <th className="py-3 px-4">Stage</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f293d]/50">
              {leadsDemo.map((lead, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-medium text-slate-200">{lead.name}</p>
                    <p className="text-xs text-slate-500">{lead.email}</p>
                  </td>
                  <td className="py-3 px-4 text-slate-400">{lead.company}</td>
                  <td className="py-3 px-4 font-semibold text-blue-400">{lead.score}/100</td>
                  <td className="py-3 px-4">
                    <Badge variant={lead.intent === 'High' ? 'success' : lead.intent === 'Medium' ? 'warning' : 'secondary'}>
                      {lead.intent}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="purple">{lead.stage}</Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
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
export default Leads;