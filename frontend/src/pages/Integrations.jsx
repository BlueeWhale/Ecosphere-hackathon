import React from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

const integrationsList = [
  { name: 'Agora RTC Engine', type: 'Real-time Voice', status: 'Not Connected', targetPhase: 'Phase 10' },
  { name: 'Google Gemini AI API', type: 'LLM Engine', status: 'Not Connected', targetPhase: 'Phase 7' },
  { name: 'Google Calendar API', type: 'Calendar Sync', status: 'Not Connected', targetPhase: 'Phase 13' },
  { name: 'MongoDB Database', type: 'Persistence', status: 'Not Connected', targetPhase: 'Phase 3' },
];

export function Integrations() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrations & API Hub"
        subtitle="Manage connectivity with external voice, calendar, and AI providers."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrationsList.map((item, idx) => (
          <Card key={idx} className="flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-slate-200">{item.name}</h4>
                <Badge variant="secondary">{item.status}</Badge>
              </div>
              <p className="text-xs text-slate-400 mb-4">Service Category: {item.type}</p>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-[#1f293d]">
              <span className="text-[11px] text-slate-500">Scheduled: {item.targetPhase}</span>
              <Button variant="outline" size="sm" disabled>Configure</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}