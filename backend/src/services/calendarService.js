import axios from 'axios';

/**
 * Validates Google Calendar API / OAuth Server Credentials.
 */
export function validateCalendarConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

  const isConfigured = Boolean(
    clientId &&
    clientSecret &&
    refreshToken &&
    !clientId.includes('your_') &&
    !clientSecret.includes('your_') &&
    !refreshToken.includes('your_')
  );

  return {
    isConfigured,
    clientId: clientId || '',
    calendarId,
  };
}

/**
 * Backend-only helper to refresh OAuth access token using refresh_token.
 * Never exposes credentials to frontend or client.
 */
async function getAccessToken() {
  const { isConfigured } = validateCalendarConfig();
  if (!isConfigured) return null;

  try {
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    });
    return response.data?.access_token || null;
  } catch (err) {
    console.warn('[Google OAuth Warning]: Could not refresh access token:', err.response?.data?.error_description || err.message);
    return null;
  }
}

/**
 * Helper to parse target date strings into Date objects.
 */
function parseTargetDate(dateStr = 'tomorrow') {
  const target = new Date();
  if (dateStr === 'tomorrow') {
    target.setDate(target.getDate() + 1);
  } else if (dateStr !== 'today' && !isNaN(new Date(dateStr).getTime())) {
    return new Date(dateStr);
  }
  return target;
}

/**
 * Helper to parse date + time string into ISO start and end Date objects.
 */
function parseMeetingDateTime(dateStr = 'tomorrow', timeStr = '2:00 PM', durationMinutes = 30) {
  const base = parseTargetDate(dateStr);
  let hours = 14;
  let minutes = 0;

  if (timeStr) {
    const match = timeStr.match(/(\d+):?(\d+)?\s*(AM|PM)?/i);
    if (match) {
      let h = parseInt(match[1], 10);
      const m = match[2] ? parseInt(match[2], 10) : 0;
      const mer = match[3] ? match[3].toUpperCase() : null;

      if (mer === 'PM' && h < 12) h += 12;
      if (mer === 'AM' && h === 12) h = 0;
      hours = h;
      minutes = m;
    }
  }

  const start = new Date(base.getFullYear(), base.getMonth(), base.getDate(), hours, minutes, 0);
  const end = new Date(start.getTime() + durationMinutes * 60000);
  return { start, end };
}

/**
 * Queries availability slots for a target date using real Google Calendar FreeBusy API or fallback.
 */
export async function getAvailability({ date = 'tomorrow', durationMinutes = 30 }) {
  const { isConfigured, calendarId } = validateCalendarConfig();
  const fallbackSlots = ['11:00 AM', '2:00 PM', '4:30 PM'];

  if (!isConfigured) {
    return {
      isConfigured: false,
      mode: 'FALLBACK',
      message: 'Google Calendar OAuth not configured. Operating in Fallback Calendar mode.',
      availableSlots: fallbackSlots,
      date,
      durationMinutes,
    };
  }

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return {
      isConfigured: false,
      mode: 'FALLBACK',
      message: 'Unable to authenticate with Google OAuth. Operating in Fallback Calendar mode.',
      availableSlots: fallbackSlots,
      date,
      durationMinutes,
    };
  }

  try {
    const targetDate = parseTargetDate(date);
    const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 9, 0, 0);
    const dayEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 17, 0, 0);

    const freeBusyRes = await axios.post(
      'https://www.googleapis.com/calendar/v3/freeBusy',
      {
        timeMin: dayStart.toISOString(),
        timeMax: dayEnd.toISOString(),
        items: [{ id: calendarId }],
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const busyList = freeBusyRes.data?.calendars?.[calendarId]?.busy || [];
    const candidateSlots = ['09:30 AM', '11:00 AM', '01:30 PM', '02:00 PM', '03:30 PM', '04:30 PM'];

    const availableSlots = candidateSlots.filter((slot) => {
      const { start, end } = parseMeetingDateTime(date, slot, durationMinutes);
      const isOverlap = busyList.some((b) => {
        const busyStart = new Date(b.start).getTime();
        const busyEnd = new Date(b.end).getTime();
        return start.getTime() < busyEnd && end.getTime() > busyStart;
      });
      return !isOverlap;
    });

    return {
      isConfigured: true,
      mode: 'GOOGLE_CALENDAR',
      message: 'Live Google Calendar availability retrieved successfully.',
      availableSlots: availableSlots.length > 0 ? availableSlots : ['05:00 PM'],
      date,
      durationMinutes,
    };
  } catch (err) {
    console.warn('[Google Calendar Warning]: FreeBusy query failed:', err.response?.data?.error?.message || err.message);
    return {
      isConfigured: false,
      mode: 'FALLBACK',
      message: 'Unable to query Google Calendar API right now. Operating in Fallback Calendar mode.',
      availableSlots: fallbackSlots,
      date,
      durationMinutes,
    };
  }
}

/**
 * Creates a confirmed Google Calendar meeting booking with double-booking protection or fallback.
 */
export async function createBooking({
  dealId,
  meetingDate = 'tomorrow',
  meetingTime = '2:00 PM',
  durationMinutes = 30,
  customerEmail = '',
  summary = 'DealPilot Enterprise Product Demo',
}) {
  const { isConfigured, calendarId } = validateCalendarConfig();
  const eventId = `evt_gcal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const { start, end } = parseMeetingDateTime(meetingDate, meetingTime, durationMinutes);
  const startAt = start;
  const endAt = end;

  // Fallback Engine execution when Google OAuth is not configured
  if (!isConfigured) {
    return {
      success: true,
      isMock: true,
      mode: 'FALLBACK',
      booking: {
        eventId,
        status: 'CONFIRMED',
        meetingDate,
        meetingTime,
        durationMinutes,
        attendeeEmail: customerEmail || 'prospect@dealpilot.ai',
        summary,
        googleCalendarLink: `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(summary)}`,
        bookedAt: new Date(),
        startAt,
        endAt,
        mode: 'FALLBACK',
        isMock: true,
      },
    };
  }

  const accessToken = await getAccessToken();
  if (!accessToken) {
    // Fallback if access token refresh fails
    return {
      success: true,
      isMock: true,
      mode: 'FALLBACK',
      booking: {
        eventId,
        status: 'CONFIRMED',
        meetingDate,
        meetingTime,
        durationMinutes,
        attendeeEmail: customerEmail || 'prospect@dealpilot.ai',
        summary,
        googleCalendarLink: `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(summary)}`,
        bookedAt: new Date(),
        startAt,
        endAt,
        mode: 'FALLBACK',
        isMock: true,
      },
    };
  }

  try {
    // Double-Booking Protection Check
    const freeBusyRes = await axios.post(
      'https://www.googleapis.com/calendar/v3/freeBusy',
      {
        timeMin: start.toISOString(),
        timeMax: end.toISOString(),
        items: [{ id: calendarId }],
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const busyList = freeBusyRes.data?.calendars?.[calendarId]?.busy || [];
    if (busyList.length > 0) {
      return {
        success: false,
        conflict: true,
        error: 'This time slot is no longer available.',
        isMock: false,
      };
    }

    // Real Google Calendar Event Creation
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const createRes = await axios.post(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
      {
        summary: summary || 'DealPilot Enterprise Product Demo',
        description: `Automated product demo session booked via DealPilot AI Agent.\nCustomer Email: ${customerEmail || 'N/A'}\nDeal Reference: ${dealId}`,
        start: { dateTime: start.toISOString(), timeZone },
        end: { dateTime: end.toISOString(), timeZone },
        attendees: customerEmail ? [{ email: customerEmail }] : [],
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const gcalEvent = createRes.data;

    return {
      success: true,
      isMock: false,
      mode: 'GOOGLE_CALENDAR',
      booking: {
        eventId: gcalEvent.id || eventId,
        status: 'CONFIRMED',
        meetingDate,
        meetingTime,
        durationMinutes,
        attendeeEmail: customerEmail || 'prospect@dealpilot.ai',
        summary,
        googleCalendarLink: gcalEvent.htmlLink || `https://calendar.google.com/calendar/event?eid=${gcalEvent.id}`,
        bookedAt: new Date(),
        startAt,
        endAt,
        mode: 'GOOGLE_CALENDAR',
        isMock: false,
      },
    };
  } catch (err) {
    console.warn('[Google Calendar Error]: Real booking failed:', err.response?.data?.error?.message || err.message);
    // Gracefully fall back to mock booking if Google Calendar API call rejects
    return {
      success: true,
      isMock: true,
      mode: 'FALLBACK',
      message: 'Google Calendar API call failed. Falling back to local booking record.',
      booking: {
        eventId,
        status: 'CONFIRMED',
        meetingDate,
        meetingTime,
        durationMinutes,
        attendeeEmail: customerEmail || 'prospect@dealpilot.ai',
        summary,
        googleCalendarLink: `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(summary)}`,
        bookedAt: new Date(),
        startAt,
        endAt,
        mode: 'FALLBACK',
        isMock: true,
      },
    };
  }
}

