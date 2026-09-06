import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Radio,
  UserCheck,
} from 'lucide-react';
import { dealAPI, calendarAPI } from '../services/api';

export function Calendar() {
  const [deals, setDeals] = useState([]);
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDealId, setSelectedDealId] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [meetingDate, setMeetingDate] = useState('tomorrow');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMessage, setBookingMessage] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch deals
      const dealsRes = await dealAPI.getDeals();
      if (dealsRes.data?.success && Array.isArray(dealsRes.data.data)) {
        const fetched = dealsRes.data.data;
        setDeals(fetched);
        if (fetched.length > 0) {
          setSelectedDealId(fetched[0]._id);
        }
      }

      // Fetch Calendar availability & configuration status
      const availRes = await calendarAPI.getAvailability({ date: meetingDate });
      if (availRes.data?.success) {
        setAvailability(availRes.data.data);
        if (availRes.data.data.availableSlots?.length > 0) {
          setSelectedTimeSlot(availRes.data.data.availableSlots[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load calendar data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [meetingDate]);

  const handleBookAppointment = async () => {
    if (!selectedDealId || !selectedTimeSlot) return;

    const targetDeal = deals.find((d) => d._id === selectedDealId);
    setBookingLoading(true);
    setBookingMessage(null);

    try {
      const res = await calendarAPI.bookMeeting({
        dealId: selectedDealId,
        meetingDate,
        meetingTime: selectedTimeSlot,
        durationMinutes: 30,
        customerEmail: targetDeal?.customerEmail || 'prospect@dealpilot.ai',
        summary: `DealPilot Enterprise Demo - ${targetDeal?.company || 'Account'}`,
      });

      if (res.data?.success) {
        setBookingMessage({
          type: 'success',
          text: `Demo meeting successfully scheduled for ${selectedTimeSlot}!`,
        });
        await loadData();
      }
    } catch (err) {
      if (err.response?.status === 409 || err.response?.data?.conflict) {
        setBookingMessage({
          type: 'error',
          text: 'This time slot is no longer available. Please select another slot.',
        });
      } else {
        setBookingMessage({
          type: 'error',
          text: err.response?.data?.message || 'Booking request failed. Please try again.',
        });
      }
    } finally {
      setBookingLoading(false);
    }
  };

  const bookedDeals = deals.filter(
    (d) => d.calendarBooking?.status === 'CONFIRMED' || d.currentStage === 'DEMO_REQUESTED'
  );

  const isConnected = Boolean(availability?.isConfigured);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Google Calendar & Action Router Appointments"
        subtitle="Automated product demo scheduling powered by Google Calendar API with fallback protection."
        action={
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? 'success' : 'warning'} className="px-3 py-1 text-xs flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span>{isConnected ? 'Google Calendar ● Connected' : 'Calendar ● Fallback Mode'}</span>
            </Badge>
          </div>
        }
      />

      {/* Calendar Status Banner */}
      <div
        className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
          isConnected
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
        }`}
      >
        <div className="flex items-center gap-3">
          {isConnected ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          )}
          <div>
            <p className="font-bold">
              {isConnected
                ? 'Official Google Calendar API Active'
                : 'Fallback Calendar Engine Active'}
            </p>
            <p className="text-[11px] opacity-90 mt-0.5">
              {isConnected
                ? 'Live Google OAuth authorization active. Availability is queried directly from Google Calendar FreeBusy endpoint.'
                : 'OAuth credentials not set in environment. System is operating safely in Fallback Mode without breaking application functionality.'}
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Booking Module */}
      <Card title="Book Enterprise Demo Appointment" subtitle="Select target account and available calendar slot">
        <div className="space-y-4 text-xs">
          {bookingMessage && (
            <div
              className={`p-3 rounded-xl border text-xs ${
                bookingMessage.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              {bookingMessage.text}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium text-slate-400 mb-1">Target Deal Account</label>
              <select
                value={selectedDealId}
                onChange={(e) => setSelectedDealId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
              >
                {deals.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.company} ({d.customerName || 'Prospect'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-400 mb-1">Meeting Date</label>
              <select
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
              >
                <option value="tomorrow">Tomorrow</option>
                <option value="today">Today</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-400 mb-1">Available Slot ({availability?.mode || 'LOCAL'})</label>
              <select
                value={selectedTimeSlot}
                onChange={(e) => setSelectedTimeSlot(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
              >
                {availability?.availableSlots?.map((slot, idx) => (
                  <option key={idx} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleBookAppointment}
              disabled={bookingLoading || !selectedDealId || !selectedTimeSlot}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {bookingLoading ? <Radio className="w-4 h-4 animate-spin" /> : <CalendarIcon className="w-4 h-4" />}
              <span>{bookingLoading ? 'Checking & Booking...' : 'Confirm Demo Appointment'}</span>
            </button>
          </div>
        </div>
      </Card>

      {/* Confirmed Demo Appointments List */}
      <Card title="Confirmed Enterprise Demo Appointments" subtitle="Live MongoDB meeting bookings">
        {loading ? (
          <div className="p-6 text-center text-slate-400 text-xs">Loading appointments from MongoDB...</div>
        ) : (
          <div className="space-y-3">
            {bookedDeals.length > 0 ? (
              bookedDeals.map((deal) => {
                const booking = deal.calendarBooking || {};
                return (
                  <div
                    key={deal._id}
                    className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
                        <CalendarIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">
                          {booking.summary || `Enterprise Demo — ${deal.company}`}
                        </p>
                        <p className="text-xs text-slate-300 font-mono mt-0.5">
                          {booking.meetingDate || 'Tomorrow'} at {booking.meetingTime || '2:00 PM'} ({booking.durationMinutes || 30} mins)
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Attendee: {booking.attendeeEmail || deal.customerEmail || 'prospect@dealpilot.ai'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      {booking.googleCalendarLink && (
                        <a
                          href={booking.googleCalendarLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 text-[11px] font-semibold rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <span>Calendar Link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      <Badge variant="success" className="text-[11px]">
                        CONFIRMED
                      </Badge>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-slate-500 italic text-xs">
                No active demo appointments booked yet. Select a deal above or start a voice call to book!
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

export default Calendar;
