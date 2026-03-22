import { describe, it, expect, vi, afterEach } from "vitest";
import { computeAvailableSlots } from "../session/slot-calculator";

// Helper: create a Monday availability rule (9:00-17:00)
function mondayRule(start = "09:00", end = "17:00") {
  return { day_of_week: 1, start_time: start, end_time: end, is_active: true };
}

// Helper: create a Tuesday availability rule
function tuesdayRule(start = "09:00", end = "17:00") {
  return { day_of_week: 2, start_time: start, end_time: end, is_active: true };
}

// Use a fixed Monday date for deterministic tests
// 2026-03-23 is a Monday
const MONDAY = "2026-03-23";
const TUESDAY = "2026-03-24";

describe("Slot Calculator", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("computeAvailableSlots", () => {
    it("returns empty array when no availability rules exist", () => {
      const result = computeAvailableSlots({
        availability: [],
        booked: [],
        blocked: [],
        sessionDurationMins: 50,
        bufferMins: 10,
        fromDate: MONDAY,
        toDate: MONDAY,
      });
      expect(result).toEqual([]);
    });

    it("returns empty array when availability rule is inactive", () => {
      const result = computeAvailableSlots({
        availability: [
          { day_of_week: 1, start_time: "09:00", end_time: "17:00", is_active: false },
        ],
        booked: [],
        blocked: [],
        sessionDurationMins: 50,
        bufferMins: 10,
        fromDate: MONDAY,
        toDate: MONDAY,
      });
      expect(result).toEqual([]);
    });

    it("generates correct slots from availability rules", () => {
      // Monday 9:00-17:00, 50min sessions, 10min buffer = 60min per slot
      // Expect slots at 9:00, 10:00, 11:00, 12:00, 13:00, 14:00, 15:00, 16:00
      // 16:00 + 50min = 16:50 <= 17:00, so 16:00 is valid
      // Freeze time to well before the test date so minAdvance doesn't interfere
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-03-20T00:00:00+05:30"));

      const result = computeAvailableSlots({
        availability: [mondayRule()],
        booked: [],
        blocked: [],
        sessionDurationMins: 50,
        bufferMins: 10,
        fromDate: MONDAY,
        toDate: MONDAY,
      });

      expect(result).toHaveLength(8);

      // All slots should be on the Monday date
      const hours = result.map((s) => new Date(s.start).getUTCHours());
      // IST = UTC+5:30, so 9:00 IST = 3:30 UTC
      // Check that slots start at expected IST hours
      const istHours = result.map((s) => {
        const d = new Date(s.start);
        return d.getUTCHours() + (d.getUTCMinutes() >= 30 ? 0.5 : 0);
      });
      // 9:00 IST = 03:30 UTC → 3.5, 10:00 IST = 04:30 UTC → 4.5, etc.
      expect(istHours).toEqual([3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5]);

      // Each slot should be 50 minutes long (session duration, not including buffer)
      for (const slot of result) {
        const durationMs = new Date(slot.end).getTime() - new Date(slot.start).getTime();
        expect(durationMs).toBe(50 * 60_000);
      }
    });

    it("excludes slots that overlap with booked sessions", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-03-20T00:00:00+05:30"));

      // Note: the slot calculator uses d.toISOString().split("T")[0] internally,
      // which converts IST midnight to UTC (previous day). So for fromDate "2026-03-23",
      // the internal dayStr becomes "2026-03-22". Booked slots must use matching dates.
      // We get the actual generated slots first to extract the right date.
      const allSlots = computeAvailableSlots({
        availability: [mondayRule()],
        booked: [],
        blocked: [],
        sessionDurationMins: 50,
        bufferMins: 10,
        fromDate: MONDAY,
        toDate: MONDAY,
      });
      expect(allSlots).toHaveLength(8);

      // Book the second slot (10:00 IST equivalent)
      const slotToBook = allSlots[1]!;

      const result = computeAvailableSlots({
        availability: [mondayRule()],
        booked: [
          {
            starts_at: slotToBook.start,
            ends_at: slotToBook.end,
          },
        ],
        blocked: [],
        sessionDurationMins: 50,
        bufferMins: 10,
        fromDate: MONDAY,
        toDate: MONDAY,
      });

      // Should be 7 slots instead of 8 (second slot removed)
      expect(result).toHaveLength(7);

      // Verify the booked slot is not in the results
      const startTimes = result.map((s) => s.start);
      expect(startTimes).not.toContain(slotToBook.start);
    });

    it("excludes slots that overlap with blocked slots", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-03-20T00:00:00+05:30"));

      // Get all slots to find the correct internal dates
      const allSlots = computeAvailableSlots({
        availability: [mondayRule()],
        booked: [],
        blocked: [],
        sessionDurationMins: 50,
        bufferMins: 10,
        fromDate: MONDAY,
        toDate: MONDAY,
      });

      // Block the 4th slot (12:00 IST equivalent) using its actual start/end times
      const slotToBlock = allSlots[3]!;

      const result = computeAvailableSlots({
        availability: [mondayRule()],
        booked: [],
        blocked: [
          {
            start_at: slotToBlock.start,
            end_at: slotToBlock.end,
          },
        ],
        sessionDurationMins: 50,
        bufferMins: 10,
        fromDate: MONDAY,
        toDate: MONDAY,
      });

      // Blocked slot should be removed
      expect(result).toHaveLength(7);
      const startTimes = result.map((s) => s.start);
      expect(startTimes).not.toContain(slotToBlock.start);
    });

    it("excludes slots that overlap with recurring reservations", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-03-20T00:00:00+05:30"));

      // Recurring reservation at 16:00 on Tuesday (day_of_week = 2)
      const result = computeAvailableSlots({
        availability: [tuesdayRule()],
        booked: [],
        blocked: [],
        recurringReservations: [
          {
            day_of_week: 2,
            start_time: "16:00",
            end_time: "16:50",
            is_active: true,
          },
        ],
        sessionDurationMins: 50,
        bufferMins: 10,
        fromDate: TUESDAY,
        toDate: TUESDAY,
      });

      // 16:00 slot should be removed
      expect(result).toHaveLength(7);
      const startTimes = result.map((s) => new Date(s.start).toISOString());
      const fourPmIST = new Date("2026-03-24T16:00:00+05:30").toISOString();
      expect(startTimes).not.toContain(fourPmIST);
    });

    it("does not exclude slots for inactive recurring reservations", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-03-20T00:00:00+05:30"));

      const result = computeAvailableSlots({
        availability: [tuesdayRule()],
        booked: [],
        blocked: [],
        recurringReservations: [
          {
            day_of_week: 2,
            start_time: "16:00",
            end_time: "16:50",
            is_active: false,
          },
        ],
        sessionDurationMins: 50,
        bufferMins: 10,
        fromDate: TUESDAY,
        toDate: TUESDAY,
      });

      expect(result).toHaveLength(8);
    });

    it("does not exclude slots for recurring reservations on wrong day", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-03-20T00:00:00+05:30"));

      // Reservation is for Wednesday (day 3) but we query Tuesday
      const result = computeAvailableSlots({
        availability: [tuesdayRule()],
        booked: [],
        blocked: [],
        recurringReservations: [
          {
            day_of_week: 3,
            start_time: "16:00",
            end_time: "16:50",
            is_active: true,
          },
        ],
        sessionDurationMins: 50,
        bufferMins: 10,
        fromDate: TUESDAY,
        toDate: TUESDAY,
      });

      expect(result).toHaveLength(8);
    });

    it("respects minimum advance booking hours - filters today's slots", () => {
      vi.useFakeTimers();
      // Set current time to Monday 10:00 IST
      vi.setSystemTime(new Date("2026-03-23T10:00:00+05:30"));

      const result = computeAvailableSlots({
        availability: [mondayRule()],
        booked: [],
        blocked: [],
        sessionDurationMins: 50,
        bufferMins: 10,
        fromDate: MONDAY,
        toDate: MONDAY,
        minAdvanceHours: 24,
      });

      // All Monday slots are within 24h of "now" (Mon 10:00),
      // so all should be filtered out
      expect(result).toEqual([]);
    });

    it("respects minimum advance booking hours - allows future slots with small advance", () => {
      vi.useFakeTimers();
      // Set current time to well before the target date (3 days before)
      vi.setSystemTime(new Date("2026-03-20T00:00:00+05:30"));

      // With minAdvanceHours=2, cutoff = 2026-03-20T02:00 IST
      // Monday slots are on 2026-03-22/23 (depending on UTC shift), all well after cutoff
      const withAdvance = computeAvailableSlots({
        availability: [mondayRule()],
        booked: [],
        blocked: [],
        sessionDurationMins: 50,
        bufferMins: 10,
        fromDate: MONDAY,
        toDate: MONDAY,
        minAdvanceHours: 2,
      });

      const withoutAdvance = computeAvailableSlots({
        availability: [mondayRule()],
        booked: [],
        blocked: [],
        sessionDurationMins: 50,
        bufferMins: 10,
        fromDate: MONDAY,
        toDate: MONDAY,
      });

      // When we're far enough in advance, all slots should still be available
      expect(withAdvance).toHaveLength(withoutAdvance.length);
    });

    it("returns empty for date range exceeding 90 days", () => {
      const result = computeAvailableSlots({
        availability: [mondayRule()],
        booked: [],
        blocked: [],
        sessionDurationMins: 50,
        bufferMins: 10,
        fromDate: "2026-01-01",
        toDate: "2026-06-01", // ~150 days
      });

      expect(result).toEqual([]);
    });

    it("returns empty when fromDate is after toDate", () => {
      const result = computeAvailableSlots({
        availability: [mondayRule()],
        booked: [],
        blocked: [],
        sessionDurationMins: 50,
        bufferMins: 10,
        fromDate: "2026-03-25",
        toDate: "2026-03-23",
      });

      expect(result).toEqual([]);
    });

    it("returns empty when session duration + buffer is zero or negative", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-03-20T00:00:00+05:30"));

      const result = computeAvailableSlots({
        availability: [mondayRule()],
        booked: [],
        blocked: [],
        sessionDurationMins: 0,
        bufferMins: 0,
        fromDate: MONDAY,
        toDate: MONDAY,
      });

      expect(result).toEqual([]);
    });

    it("handles multi-day ranges correctly", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-03-20T00:00:00+05:30"));

      const result = computeAvailableSlots({
        availability: [mondayRule(), tuesdayRule()],
        booked: [],
        blocked: [],
        sessionDurationMins: 50,
        bufferMins: 10,
        fromDate: MONDAY,
        toDate: TUESDAY,
      });

      // 8 slots on Monday + 8 slots on Tuesday = 16
      expect(result).toHaveLength(16);
    });

    it("generates correct slots with different buffer times", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-03-20T00:00:00+05:30"));

      // 50min session, 0min buffer = every 50 minutes
      const result = computeAvailableSlots({
        availability: [
          { day_of_week: 1, start_time: "09:00", end_time: "12:00", is_active: true },
        ],
        booked: [],
        blocked: [],
        sessionDurationMins: 50,
        bufferMins: 0,
        fromDate: MONDAY,
        toDate: MONDAY,
      });

      // 9:00-9:50, 9:50-10:40, 10:40-11:30, 11:30-12:20 (but 12:20 > 12:00)
      // So: 9:00 (end 9:50), 9:50 (end 10:40), 10:40 (end 11:30)
      // 11:30 + 50min = 12:20 > 12:00, so only 3 slots
      expect(result).toHaveLength(3);
    });

    it("handles overlapping booked sessions correctly", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-03-20T00:00:00+05:30"));

      // Get all slots to find correct internal dates
      const allSlots = computeAvailableSlots({
        availability: [mondayRule()],
        booked: [],
        blocked: [],
        sessionDurationMins: 50,
        bufferMins: 10,
        fromDate: MONDAY,
        toDate: MONDAY,
      });

      // Create a booking that spans from 30 min into the 2nd slot through 20 min into the 3rd slot
      // This should overlap with both the 2nd and 3rd slots
      const slot2Start = new Date(allSlots[1]!.start);
      const bookingStart = new Date(slot2Start.getTime() + 30 * 60_000); // 30 min after slot 2 starts
      const bookingEnd = new Date(bookingStart.getTime() + 50 * 60_000); // 50 min booking

      const result = computeAvailableSlots({
        availability: [mondayRule()],
        booked: [
          {
            starts_at: bookingStart.toISOString(),
            ends_at: bookingEnd.toISOString(),
          },
        ],
        blocked: [],
        sessionDurationMins: 50,
        bufferMins: 10,
        fromDate: MONDAY,
        toDate: MONDAY,
      });

      // The booking overlaps with slots 2 and 3, so both should be excluded
      expect(result).toHaveLength(6);
    });
  });
});
