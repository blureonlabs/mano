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

/**
 * Computes available time slots for a therapist within a date range.
 * Subtracts booked sessions and blocked slots from the weekly availability.
 */
export function computeAvailableSlots(opts: {
  availability: AvailabilityRule[];
  booked: BookedSlot[];
  blocked: BlockedSlot[];
  sessionDurationMins: number;
  bufferMins: number;
  fromDate: string; // YYYY-MM-DD
  toDate: string;
}): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const slotDuration = opts.sessionDurationMins + opts.bufferMins;

  const from = new Date(`${opts.fromDate}T00:00:00+05:30`);
  const to = new Date(`${opts.toDate}T23:59:59+05:30`);
  const now = new Date();

  for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    const rule = opts.availability.find(
      (a) => a.day_of_week === dayOfWeek && a.is_active
    );
    if (!rule) continue;

    const dayStr = d.toISOString().split("T")[0];
    let cursor = new Date(`${dayStr}T${rule.start_time}+05:30`);
    const dayEnd = new Date(`${dayStr}T${rule.end_time}+05:30`);

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
      const isPast = cursor <= now;

      if (!isBooked && !isBlocked && !isPast) {
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
