import React from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Building2, Search } from 'lucide-react';

const customersDemo = [
  { name: 'Nexus Technologies', contact: 'Rohan Sharma', plan: 'Enterprise Pro', users: '50 Seats', status: 'Active Account', arr: '$24,000' },
  { name: 'Apex Cloud Solutions', contact: 'Ananya Verma', plan: 'Growth Tier', users: '20 Seats', status: 'Onboarding', arr: '$9,600' },
  { name: 'FinPulse Systems', contact: 'Vikram Malhotra', plan: 'Enterprise Custom', users: '120 Seats', status: 'Active Account', arr: '$58,000' },
];

export function Customers() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Accounts"
        subtitle="View converted accounts and managed client profiles."
      />

      <Card>
        <div className="relative max-w-sm mb-4">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search accounts..."
            className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#1f293d] text-slate-400 text-xs uppercase font-semibold">
                <th className="py-3 px-4">Company Account</th>
                <th className="py-3 px-4">Primary Contact</th>
                <th className="py-3 px-4">Active Plan</th>
                <th className="py-3 px-4">Seats</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Contract ARR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f293d]/50">
              {customersDemo.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-200 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-400" />
                    {item.name}
                  </td>
                  <td className="py-3 px-4 text-slate-400">{item.contact}</td>
                  <td className="py-3 px-4 text-slate-300">{item.plan}</td>
                  <td className="py-3 px-4 text-slate-400">{item.users}</td>
                  <td className="py-3 px-4">
                    <Badge variant="success">{item.status}</Badge>
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-emerald-400">{item.arr}</td>
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
export default Customers;