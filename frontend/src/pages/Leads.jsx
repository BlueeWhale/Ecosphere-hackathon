import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Plus, Search, Filter, MoreHorizontal, Radio, ArrowRight } from 'lucide-react';
import { dealAPI, leadAPI } from '../services/api';

export function Leads() {
  const [leads, setLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadRealLeads() {
      try {
        setLoading(true);
        const leadRes = await leadAPI.getLeads();
        if (leadRes.data?.success && Array.isArray(leadRes.data.data) && leadRes.data.data.length > 0) {
          setLeads(leadRes.data.data);
        } else {
          const res = await dealAPI.getDeals();
          if (res.data?.success && Array.isArray(res.data.data)) {
            setLeads(res.data.data);
          }
        }
      } catch (err) {
        console.error('Failed to fetch real leads:', err);
      } finally {
        setLoading(false);
      }
    }
    loadRealLeads();
  }, []);

  const filteredLeads = leads.filter((item) => {
    const search = searchTerm.toLowerCase();
    return (
      (item.customerName || '').toLowerCase().includes(search) ||
      (item.company || '').toLowerCase().includes(search) ||
      (item.currentStage || '').toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Authenticated Leads Pipeline"
        subtitle="Real MongoDB lead qualification statuses, intent scores, and next-best actions."
        action={<Button icon={Plus}>Add Lead</Button>}
      />

      <Card>
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4 justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search leads by name, company, or stage..."
              className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>
          <Button variant="secondary" size="sm" icon={Filter}>
            Filter Pipeline
          </Button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
            <Radio className="w-5 h-5 text-blue-400 animate-spin" />
            <span>Loading authenticated leads from MongoDB...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#1f293d] text-slate-400 text-xs uppercase font-semibold">
                  <th className="py-3 px-4">Lead Name</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Intent</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">Next Best Action</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f293d]/50 text-xs">
                {filteredLeads.length > 0 ? (
                  filteredLeads.map((lead) => (
                    <tr key={lead._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-200">{lead.customerName || 'Prospect Lead'}</p>
                        <p className="text-[11px] text-slate-500">{lead.customerEmail || 'No email registered'}</p>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-300">{lead.company}</td>
                      <td className="py-3 px-4 font-bold text-emerald-400">{lead.dealScore ?? 10}/100</td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            lead.buyingIntent === 'HIGH' || lead.buyingIntent === 'VERY_HIGH'
                              ? 'success'
                              : lead.buyingIntent === 'MEDIUM'
                              ? 'warning'
                              : 'secondary'
                          }
                        >
                          {lead.buyingIntent || 'UNKNOWN'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="purple">{lead.currentStage}</Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-300 max-w-xs truncate">
                        {lead.nextBestAction || 'Qualify requirement scope'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => navigate('/deal-state')}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-blue-400 font-semibold rounded-lg text-[11px] inline-flex items-center gap-1 transition-colors"
                        >
                          <span>Open State</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-6 text-center text-slate-500 italic">
                      No leads match the specified criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

export default Leads;
