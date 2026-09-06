import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Building2, Search, Radio } from 'lucide-react';
import { customerAPI, dealAPI } from '../services/api';

export function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadCustomers() {
      try {
        setLoading(true);
        const res = await customerAPI.getCustomers();
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setCustomers(res.data.data);
        } else {
          // Fallback: derive customer accounts from won/active deals if dedicated customers collection has no entries
          const dealsRes = await dealAPI.getDeals();
          if (dealsRes.data?.success && Array.isArray(dealsRes.data.data)) {
            const derived = dealsRes.data.data.map((d) => ({
              _id: d._id,
              company: d.company,
              name: d.customerName || 'Primary Contact',
              email: d.customerEmail || 'n/a',
              plan: d.product || d.productInterest || 'Enterprise Suite',
              users: `${d.numberOfUsers || 1} Seats`,
              status: d.status === 'won' ? 'Active Account' : 'In Negotiation',
              arr: d.pricingContext?.quotedAmount ? `$${Number(d.pricingContext.quotedAmount).toLocaleString()}` : '$0',
            }));
            setCustomers(derived);
          }
        }
      } catch (err) {
        console.error('Failed to load customers from backend:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCustomers();
  }, []);

  const filteredCustomers = customers.filter((c) => {
    const s = searchTerm.toLowerCase();
    return (
      (c.company || c.name || '').toLowerCase().includes(s) ||
      (c.email || '').toLowerCase().includes(s) ||
      (c.plan || '').toLowerCase().includes(s)
    );
  });

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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search accounts..."
            className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-blue-500"
          />
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
            <Radio className="w-5 h-5 text-blue-400 animate-spin" />
            <span>Loading authenticated customer accounts from MongoDB...</span>
          </div>
        ) : (
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
              <tbody className="divide-y divide-[#1f293d]/50 text-xs">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((item, idx) => (
                    <tr key={item._id || idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-200 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-400" />
                        {item.company || item.name}
                      </td>
                      <td className="py-3 px-4 text-slate-400">{item.name || item.customerName || 'N/A'}</td>
                      <td className="py-3 px-4 text-slate-300">{item.plan || item.product || 'Standard Plan'}</td>
                      <td className="py-3 px-4 text-slate-400">{item.users || `${item.numberOfUsers || 1} Seats`}</td>
                      <td className="py-3 px-4">
                        <Badge variant={item.status === 'Active Account' || item.status === 'active' ? 'success' : 'warning'}>
                          {item.status || 'Active'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-emerald-400">
                        {item.arr || (item.pricingContext?.quotedAmount ? `$${item.pricingContext.quotedAmount}` : 'N/A')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-slate-500 italic">
                      No customer accounts found in MongoDB.
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

export default Customers;