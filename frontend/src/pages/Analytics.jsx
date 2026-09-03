import React from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { BarChart3 } from 'lucide-react';

export function Analytics() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales & Intent Analytics"
        subtitle="AI qualification rates, intent distribution, and conversion breakdown."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Objection Distribution Shell">
          <div className="h-48 rounded-xl bg-slate-900/60 border border-slate-800 border-dashed flex items-center justify-center text-xs text-slate-500">
            [Objection Breakdown Chart Shell]
          </div>
        </Card>
        <Card title="Buying Intent Breakdown Shell">
          <div className="h-48 rounded-xl bg-slate-900/60 border border-slate-800 border-dashed flex items-center justify-center text-xs text-slate-500">
            [Intent Metric Chart Shell]
          </div>
        </Card>
      </div>
    </div>
  );
}

// src/pages/Analytics.jsx ke sabse last mein add karein:
export default Analytics;