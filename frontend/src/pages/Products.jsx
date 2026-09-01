import React from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Package, Check } from 'lucide-react';

const productsDemo = [
  { name: 'Starter Tier', price: '$49 / seat', features: ['Standard AI Qualification', 'Basic CRM Sync', 'Email Follow-ups'], status: 'Active' },
  { name: 'Growth Tier', price: '$99 / seat', features: ['Adaptive AI Negotiation', 'RAG Knowledge Integration', 'Google Calendar Booking'], status: 'Active' },
  { name: 'Enterprise Suite', price: '$199 / seat', features: ['Real-time Voice RTC', 'Custom Negotiation Rules', 'Human Agent Escalation'], status: 'Active' },
];

export function Products() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Catalog & Pricing"
        subtitle="Catalog configurations consumed by RAG and Negotiation Engines."
      />

      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300">
        Note: Displayed catalog cards serve as temporary UI placeholders. Dynamic catalog vector embeddings will connect via MongoDB & Python RAG in Phase 9.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {productsDemo.map((product, idx) => (
          <Card key={idx} className="flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-lg text-white">{product.name}</h3>
                <Badge variant="success">{product.status}</Badge>
              </div>
              <p className="text-2xl font-extrabold text-blue-400 mb-4">{product.price}</p>
              <ul className="space-y-2 text-xs text-slate-300">
                {product.features.map((feat, fIdx) => (
                  <li key={fIdx} className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}