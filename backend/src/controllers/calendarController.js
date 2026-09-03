import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getAvailability, createBooking } from '../services/calendarService.js';
import { routeAction } from '../services/actionRouterService.js';
import { triggerEscalation, takeoverDeal } from '../services/escalationService.js';
import { Deal } from '../models/Deal.js';

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

  const actionResult = await routeAction({
    dealId: deal._id.toString(),
    actionType: 'BOOKING_CONFIRMED',
    payload: {
      meetingDate: meetingDate || 'tomorrow',
      meetingTime: meetingTime || '2:00 PM',
      durationMinutes: durationMinutes || 30,
      customerEmail: customerEmail || deal.customerEmail,
      summary: summary || `DealPilot Enterprise Demo - ${deal.company}`,
    },
    actionId: `manual_book_${Date.now()}`,
  });

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

  const result = await takeoverDeal({
    dealId,
    userId: req.user._id || req.user.id,
  });

  res.status(200).json({
    success: true,
    data: result,
  });
});
