import React from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { BrainCircuit } from 'lucide-react';

export function DealState() {
  const dealStateData = {
    customerName: 'Rohan Sharma',
    company: 'Nexus Technologies',
    requirements: ['50 User Licenses', 'REST API Access', 'Custom Workflow Triggers'],
    numberOfUsers: 50,
    budget: '₹5,000,000 / year',
    productInterest: 'DealPilot Enterprise Suite',
    competitorMentioned: ['Competitor X'],
    objections: ['Price is higher than Competitor X standard plan'],
    intent: 'high',
    dealStage: 'negotiation',
    sentiment: 'positive',
    demoRequested: true,
    followUpRequired: true,
    humanEscalationRequired: false,
    nextBestAction: 'Offer Enterprise Volume Discount with annual commitment requirement',
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dynamic Deal State"
        subtitle="Real-time structured memory representation updated by AI Service."
      />

      <Card title="Active Deal Memory JSON Inspector" subtitle="Entity parameters automatically updated during call execution">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <p className="text-slate-400">Customer Name: <span className="text-white font-semibold">{dealStateData.customerName}</span></p>
            <p className="text-slate-400">Company: <span className="text-white font-semibold">{dealStateData.company}</span></p>
            <p className="text-slate-400">Target Seats: <span className="text-white font-semibold">{dealStateData.numberOfUsers}</span></p>
            <p className="text-slate-400">Budget Limit: <span className="text-white font-semibold">{dealStateData.budget}</span></p>
            <p className="text-slate-400">Product Interest: <span className="text-white font-semibold">{dealStateData.productInterest}</span></p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div>
              <span className="text-slate-400 block mb-1">Extracted Requirements:</span>
              <div className="flex flex-wrap gap-1">
                {dealStateData.requirements.map((req, i) => (
                  <Badge key={i} variant="primary">{req}</Badge>
                ))}
              </div>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Competitors & Objections:</span>
              <div className="flex flex-wrap gap-1">
                {dealStateData.competitorMentioned.map((comp, i) => (
                  <Badge key={i} variant="warning">Vs {comp}</Badge>
                ))}
                {dealStateData.objections.map((obj, i) => (
                  <Badge key={i} variant="danger">{obj}</Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Next Best Action Banner */}
        <div className="mt-4 p-4 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center gap-3">
          <BrainCircuit className="w-5 h-5 text-blue-400 shrink-0" />
          <div className="text-xs">
            <span className="font-semibold text-blue-400 block">Computed Next Best Action:</span>
            <span className="text-slate-200">{dealStateData.nextBestAction}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}