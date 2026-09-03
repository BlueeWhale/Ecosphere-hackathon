import React from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export function Settings() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="System Settings"
        subtitle="Configure system preferences and operator profile defaults."
      />

      <Card title="AI Agent Configuration Shell" subtitle="General operational parameters">
        <div className="space-y-4 max-w-md text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Agent Persona Display Name</label>
            <input
              type="text"
              defaultValue="DealPilot AI Sales Representative"
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-xl px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Default Escalation Threshold</label>
            <input
              type="text"
              defaultValue="High Value (> $50,000 ARR)"
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-xl px-3 py-2"
            />
          </div>
          <Button variant="primary">Save Preferences</Button>
        </div>
      </Card>
    </div>
  );
}


// src/pages/Conversations.jsx ke end mein:
export default Settings;