import type { TimeSlot } from "@mano/shared";

interface AvailabilityRule {
  day_of_week: number;
  start_time: string; // "HH:MM"
  end_time: string;
  is_active: boolean;
}

interface BookedSlot {
  starts_at: string;
  ends_at: string;
}

interface BlockedSlot {
  start_at: string;
  end_at: string;
}

interface RecurringReservation {
  day_of_week: number;
  start_time: string; // "HH:MM"
  end_time: string;
  is_active: boolean;
}

const MAX_DATE_RANGE_DAYS = 90;

/**
 * Computes available time slots for a therapist within a date range.
 * Subtracts booked sessions, blocked slots, and recurring reservations
 * from the weekly availability. Enforces minimum advance booking hours.
 */
export function computeAvailableSlots(opts: {
  availability: AvailabilityRule[];
  booked: BookedSlot[];
  blocked: BlockedSlot[];
  recurringReservations?: RecurringReservation[];
  sessionDurationMins: number;
  bufferMins: number;
  fromDate: string; // YYYY-MM-DD
  toDate: string;
  minAdvanceHours?: number;
}): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const slotDuration = opts.sessionDurationMins + opts.bufferMins;

  // Guard against zero or negative duration (would cause infinite loop)
  if (slotDuration <= 0) return slots;

  const minAdvanceMs = (opts.minAdvanceHours ?? 0) * 60 * 60_000;

  const from = new Date(`${opts.fromDate}T00:00:00+05:30`);
  const to = new Date(`${opts.toDate}T23:59:59+05:30`);

  // Validate dates
  if (isNaN(from.getTime()) || isNaN(to.getTime()) || from > to) return slots;

  // Cap date range to prevent DoS
  const rangeDays = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
  if (rangeDays > MAX_DATE_RANGE_DAYS) return slots;

  const now = new Date();
  const cutoff = new Date(now.getTime() + minAdvanceMs);

  for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    const rule = opts.availability.find(
      (a) => a.day_of_week === dayOfWeek && a.is_active
    );
    if (!rule) continue;

    const dayStr = d.toISOString().split("T")[0];
    let cursor = new Date(`${dayStr}T${rule.start_time}+05:30`);
    const dayEnd = new Date(`${dayStr}T${rule.end_time}+05:30`);

    // Skip if times parse to invalid dates
    if (isNaN(cursor.getTime()) || isNaN(dayEnd.getTime())) continue;

    while (
      cursor.getTime() + opts.sessionDurationMins * 60_000 <=
      dayEnd.getTime()
    ) {
      const slotEnd = new Date(
        cursor.getTime() + opts.sessionDurationMins * 60_000
      );

      const isBooked = opts.booked.some(
        (s) => new Date(s.starts_at) < slotEnd && new Date(s.ends_at) > cursor
      );
      const isBlocked = opts.blocked.some(
        (b) => new Date(b.start_at) < slotEnd && new Date(b.end_at) > cursor
      );

      // Check if a recurring reservation covers this slot
      const isReserved = (opts.recurringReservations ?? []).some((r) => {
        if (!r.is_active || r.day_of_week !== dayOfWeek) return false;
        const rStart = new Date(`${dayStr}T${r.start_time}+05:30`);
        const rEnd = new Date(`${dayStr}T${r.end_time}+05:30`);
        return rStart < slotEnd && rEnd > cursor;
      });

      // Must be after cutoff (now + minAdvanceHours)
      const isTooSoon = cursor <= cutoff;

      if (!isBooked && !isBlocked && !isReserved && !isTooSoon) {
        slots.push({
          start: cursor.toISOString(),
          end: slotEnd.toISOString(),
        });
      }

      cursor = new Date(cursor.getTime() + slotDuration * 60_000);
    }
  }

  return slots;
}
