import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getAvailability, createBooking } from '../services/calendarService.js';
import { routeAction } from '../services/actionRouterService.js';
import { triggerEscalation, takeoverDeal } from '../services/escalationService.js';
import { Deal } from '../models/Deal.js';
import { Booking } from '../models/Booking.js';

/**
 * Helper to parse date/time pairs into {start,end} boundaries.
 * Mirror of calendarService parser for DB overlap checks.
 */
function parseSlot(meetingDate = 'tomorrow', meetingTime = '2:00 PM', durationMinutes = 30) {
  const base = new Date();
  if (meetingDate === 'tomorrow') {
    base.setDate(base.getDate() + 1);
  } else if (meetingDate !== 'today' && !isNaN(new Date(meetingDate).getTime())) {
    base.setTime(new Date(meetingDate).getTime());
  }
  let hours = 14;
  let minutes = 0;
  if (meetingTime) {
    const m = meetingTime.match(/(\d+):?(\d+)?\s*(AM|PM)?/i);
    if (m) {
      let h = parseInt(m[1], 10);
      const mm = m[2] ? parseInt(m[2], 10) : 0;
      const mer = m[3] ? m[3].toUpperCase() : null;
      if (mer === 'PM' && h < 12) h += 12;
      if (mer === 'AM' && h === 12) h = 0;
      hours = h;
      minutes = mm;
    }
  }
  const start = new Date(base.getFullYear(), base.getMonth(), base.getDate(), hours, minutes, 0);
  const end = new Date(start.getTime() + durationMinutes * 60000);
  return { start, end };
}

// GET /api/calendar/availability
export const getCalendarAvailability = asyncHandler(async (req, res) => {
  const { date, durationMinutes } = req.query;
  const availability = await getAvailability({
    date: date || 'tomorrow',
    durationMinutes: Number(durationMinutes) || 30,
  });

  res.status(200).json({
    success: true,
    data: availability,
  });
});

// POST /api/calendar/book
export const bookCalendarMeeting = asyncHandler(async (req, res) => {
  const { dealId, meetingDate, meetingTime, durationMinutes, customerEmail, summary } = req.body;

  if (!dealId || !mongoose.Types.ObjectId.isValid(dealId)) {
    res.status(400);
    throw new Error('Valid dealId is required for booking');
  }

  const deal = await Deal.findById(dealId);
  if (!deal) {
    res.status(404);
    throw new Error('Deal not found');
  }

  // Ownership check
  if (req.user.role !== 'admin' && deal.user && !deal.user.equals(req.user._id || req.user.id)) {
    res.status(403);
    throw new Error('Not authorized to book meeting for this deal');
  }

  // DB-level double-booking protection (covers both Google Calendar and FALLBACK paths)
  const dur = Number(durationMinutes) || 30;
  const { start, end } = parseSlot(meetingDate || 'tomorrow', meetingTime || '2:00 PM', dur);
  const overlappingBooking = await Booking.findOne({
    status: { $in: ['CONFIRMED'] },
    $or: [
      { startAt: { $lt: end }, endAt: { $gt: start } },
    ],
  });
  if (overlappingBooking) {
    return res.status(409).json({
      success: false,
      conflict: true,
      message: 'This time slot is no longer available (local booking conflict).',
    });
  }

  const actionResult = await routeAction({
    dealId: deal._id.toString(),
    actionType: 'BOOKING_CONFIRMED',
    payload: {
      meetingDate: meetingDate || 'tomorrow',
      meetingTime: meetingTime || '2:00 PM',
      durationMinutes: dur,
      customerEmail: customerEmail || deal.customerEmail,
      summary: summary || `DealPilot Enterprise Demo - ${deal.company}`,
    },
    actionId: `manual_book_${Date.now()}`,
  });

  if (actionResult?.conflict) {
    return res.status(409).json({
      success: false,
      conflict: true,
      message: actionResult.error || 'This time slot is no longer available.',
    });
  }

  res.status(200).json({
    success: true,
    data: actionResult,
  });
});

// POST /api/calendar/escalate
export const escalateDealToHuman = asyncHandler(async (req, res) => {
  const { dealId, sessionId, reason } = req.body;

  if (!dealId || !mongoose.Types.ObjectId.isValid(dealId)) {
    res.status(400);
    throw new Error('Valid dealId is required for escalation');
  }
  const deal = await Deal.findById(dealId);
  if (!deal) { res.status(404); throw new Error('Deal not found'); }
  if (req.user.role !== 'admin' && deal.tenantId?.toString() !== req.user.tenantId?.toString()) {
    res.status(403); throw new Error('Not authorized to escalate this company deal');
  }

  const result = await triggerEscalation({
    dealId,
    sessionId,
    reason: reason || 'Manual human escalation requested from dashboard',
    triggeredBy: 'HUMAN_USER',
  });

  res.status(200).json({
    success: true,
    data: result,
  });
});

// POST /api/calendar/takeover
export const takeoverDealByHuman = asyncHandler(async (req, res) => {
  const { dealId } = req.body;

  if (!dealId || !mongoose.Types.ObjectId.isValid(dealId)) {
    res.status(400);
    throw new Error('Valid dealId is required for takeover');
  }
  const deal = await Deal.findById(dealId);
  if (!deal) { res.status(404); throw new Error('Deal not found'); }
  if (req.user.role !== 'admin' && deal.tenantId?.toString() !== req.user.tenantId?.toString()) {
    res.status(403); throw new Error('Not authorized to take over this company deal');
  }

  const result = await takeoverDeal({
    dealId,
    userId: req.user._id || req.user.id,
  });

  res.status(200).json({
    success: true,
    data: result,
  });
});
