import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Calendar as CalendarIcon, Clock, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { dealAPI, calendarAPI } from '../services/api';

export function Calendar() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBookings() {
      try {
        setLoading(true);
        const res = await dealAPI.getDeals();
        if (res.data?.success && Array.isArray(res.data.data)) {
          setDeals(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load deals for calendar:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBookings();
  }, []);

  const bookedDeals = deals.filter(d => d.calendarBooking?.status === 'CONFIRMED' || d.currentStage === 'DEMO_REQUESTED');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Google Calendar & Action Router Bookings"
        subtitle="Automated meeting appointments booked by DealPilot AI Agent."
      />

      <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>
          Action Layer Router Active: Calendar availability check, automated time slot negotiation, and booking creation are integrated with backend services.
        </span>
      </div>

      <Card title="Confirmed Enterprise Demo Appointments" subtitle="Live MongoDB meeting bookings">
        {loading ? (
          <div className="p-6 text-center text-slate-400 text-xs">Loading appointments...</div>
        ) : (
          <div className="space-y-3">
            {bookedDeals.length > 0 ? (
              bookedDeals.map((deal) => {
                const booking = deal.calendarBooking || {};
                return (
                  <div key={deal._id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                        <CalendarIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{booking.summary || `Enterprise Demo — ${deal.company}`}</p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                          {booking.meetingDate || 'Tomorrow'} at {booking.meetingTime || '2:00 PM'} ({booking.durationMinutes || 30} mins)
                        </p>
                        <p className="text-[11px] text-slate-500">Attendee: {booking.attendeeEmail || deal.customerEmail || 'prospect@dealpilot.ai'}</p>
                      </div>
                    </div>
                    <Badge variant="success" className="text-[11px]">
                      CONFIRMED
                    </Badge>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-slate-500 italic text-xs">
                No active demo appointments booked yet. Start a voice call on any deal to request a demo!
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

export default Calendar;
