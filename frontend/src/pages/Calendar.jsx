import React from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Calendar as CalendarIcon, Clock, AlertTriangle } from 'lucide-react';

export function Calendar() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar & Demo Bookings"
        subtitle="Schedule grid and automated demo bookings."
      />

      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-blue-400 shrink-0" />
        <span>Google Calendar OAuth API integration will be implemented in Phase 13.</span>
      </div>

      <Card title="Upcoming Demo Slots" subtitle="Automated appointments booked by AI Agent">
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-4 h-4 text-blue-400" />
              <div>
                <p className="text-sm font-semibold text-slate-200">Enterprise Product Demo — Rohan Sharma</p>
                <p className="text-xs text-slate-400">Sep 03, 2026 at 3:00 PM IST</p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              Confirmed
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}