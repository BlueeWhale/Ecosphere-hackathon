import { Deal } from '../models/Deal.js';
import { updateDealMemory, formatDealState } from './dealMemoryService.js';
import { getAvailability, createBooking } from './calendarService.js';
import { triggerEscalation } from './escalationService.js';
import { emitDealUpdate } from './socketService.js';

// Cache processed action IDs for idempotency
const processedActionIds = new Set();

/**
 * Central Action Router Layer.
 * Intercepts AI intent and executes deterministic business actions.
 */
export async function routeAction({
  dealId,
  sessionId,
  actionType,
  payload = {},
  actionId,
}) {
  if (!dealId) return null;

  // Idempotency check: prevent duplicate execution of the same action request
  if (actionId) {
    if (processedActionIds.has(actionId)) {
      console.log(`[Action Router]: Skipping duplicate action execution for actionId: ${actionId}`);
      const deal = await Deal.findById(dealId);
      return { success: true, duplicate: true, dealState: formatDealState(deal) };
    }
    processedActionIds.add(actionId);
    if (processedActionIds.size > 1000) {
      const firstItem = processedActionIds.values().next().value;
      processedActionIds.delete(firstItem);
    }
  }

  const deal = await Deal.findById(dealId);
  if (!deal) return null;

  let actionResult = { actionType, success: true };

  switch (actionType) {
    case 'DEMO_REQUEST': {
      const avail = await getAvailability({ date: payload.date || 'tomorrow' });
      deal.calendarBooking = {
        ...(deal.calendarBooking?.toObject?.() || deal.calendarBooking || {}),
        status: 'SLOTS_OFFERED',
        summary: 'Enterprise Product Demo',
      };
      await deal.save();

      await updateDealMemory(
        dealId,
        {
          currentStage: 'DEMO_REQUESTED',
          buyingIntent: 'HIGH',
          importantFacts: ['Customer requested enterprise demo'],
          nextBestAction: 'Confirm demo meeting time slot with prospect',
        },
        deal.user,
        'admin'
      );

      actionResult = {
        actionType,
        success: true,
        availableSlots: avail.availableSlots,
        message: avail.message,
      };
      break;
    }

    case 'BOOKING_CONFIRMED': {
      const bookingRes = await createBooking({
        dealId,
        meetingDate: payload.meetingDate || 'tomorrow',
        meetingTime: payload.meetingTime || '2:00 PM',
        durationMinutes: payload.durationMinutes || 30,
        customerEmail: payload.customerEmail || deal.customerEmail || 'prospect@dealpilot.ai',
        summary: `DealPilot Enterprise Demo - ${deal.company}`,
      });

      if (bookingRes.success && bookingRes.booking) {
        deal.calendarBooking = bookingRes.booking;
        await deal.save();

        await updateDealMemory(
          dealId,
          {
            currentStage: 'DEMO_REQUESTED',
            buyingIntent: 'VERY_HIGH',
            importantFacts: [
              `Enterprise demo scheduled for ${bookingRes.booking.meetingDate} at ${bookingRes.booking.meetingTime}`,
            ],
            nextBestAction: 'Conduct enterprise demo and present tailored solution',
          },
          deal.user,
          'admin'
        );
      }

      actionResult = {
        actionType,
        success: bookingRes.success,
        booking: bookingRes.booking,
      };
      break;
    }

    case 'HUMAN_ESCALATION': {
      const escRes = await triggerEscalation({
        dealId,
        sessionId,
        reason: payload.reason || 'Human sales representative assistance requested',
        triggeredBy: 'CUSTOMER_REQUEST',
      });
      actionResult = {
        actionType,
        success: true,
        escalation: escRes?.escalation,
      };
      break;
    }

    case 'PRICE_NEGOTIATION': {
      if (payload.requestedDiscountPct > 25) {
        await triggerEscalation({
          dealId,
          sessionId,
          reason: `Requested ${payload.requestedDiscountPct}% discount exceeds 25% policy ceiling`,
          triggeredBy: 'DETERMINISTIC_PRICING_ENGINE',
        });
      }
      actionResult = {
        actionType,
        success: true,
        cappedDiscountPct: Math.min(25, payload.requestedDiscountPct || 0),
      };
      break;
    }

    default:
      actionResult = { actionType: 'NONE', success: true };
      break;
  }

  const updatedDeal = await Deal.findById(dealId);
  const updatedState = formatDealState(updatedDeal);
  emitDealUpdate(dealId, updatedState);

  return {
    ...actionResult,
    dealState: updatedState,
  };
}
