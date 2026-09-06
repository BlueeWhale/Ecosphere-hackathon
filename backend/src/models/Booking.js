import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    // Link to Deal
    deal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deal',
      required: true,
      index: true,
    },

    // Booking Owner (the user who booked it / deal owner)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },

    // Google Calendar event info
    eventId: { type: String, default: '', index: true },
    googleCalendarLink: { type: String, default: '' },
    mode: {
      type: String,
      enum: ['GOOGLE_CALENDAR', 'FALLBACK'],
      default: 'FALLBACK',
    },
    isMock: { type: Boolean, default: true },

    // Meeting details
    status: {
      type: String,
      enum: ['NONE', 'SLOTS_OFFERED', 'CONFIRMED', 'CANCELLED', 'FAILED'],
      default: 'CONFIRMED',
      index: true,
    },
    summary: { type: String, trim: true, default: '' },
    meetingDate: { type: String, default: '' },
    meetingTime: { type: String, default: '' },
    durationMinutes: { type: Number, default: 30 },
    attendeeEmail: { type: String, trim: true, lowercase: true, default: '' },

    // Timestamps for actual slot boundaries (for double-booking checks)
    startAt: { type: Date, index: true },
    endAt: { type: Date, index: true },

    bookedAt: { type: Date, default: Date.now },
    conflict: { type: Boolean, default: false },
    errorMessage: { type: String, default: '' },
  },
  { timestamps: true }
);

bookingSchema.index({ startAt: 1, endAt: 1, mode: 1 });

export const Booking = mongoose.model('Booking', bookingSchema);
