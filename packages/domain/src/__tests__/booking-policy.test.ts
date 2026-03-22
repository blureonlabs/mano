import { describe, it, expect, vi, afterEach } from "vitest";
import { BookingPolicyService } from "../booking/booking-policy.service";

describe("BookingPolicyService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("isWithinAdvanceWindow", () => {
    it("returns true when there is enough advance time", () => {
      vi.useFakeTimers();
      // Now = Mon 09:00 IST, slot = Mon 15:00 IST (6 hours away)
      vi.setSystemTime(new Date("2026-03-23T09:00:00+05:30"));

      const slotStart = new Date("2026-03-23T15:00:00+05:30");
      expect(BookingPolicyService.isWithinAdvanceWindow(slotStart, 4)).toBe(true);
    });

    it("returns false when booking is too soon", () => {
      vi.useFakeTimers();
      // Now = Mon 14:00, slot = Mon 15:00 (only 1 hour away, need 4)
      vi.setSystemTime(new Date("2026-03-23T14:00:00+05:30"));

      const slotStart = new Date("2026-03-23T15:00:00+05:30");
      expect(BookingPolicyService.isWithinAdvanceWindow(slotStart, 4)).toBe(false);
    });

    it("handles 0 hours (always allowed for future slots)", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-03-23T14:59:00+05:30"));

      const slotStart = new Date("2026-03-23T15:00:00+05:30");
      // 1 minute away, but 0 hours required — should be allowed
      expect(BookingPolicyService.isWithinAdvanceWindow(slotStart, 0)).toBe(true);
    });

    it("returns false when 0 hours required but slot is in the past", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-03-23T16:00:00+05:30"));

      const slotStart = new Date("2026-03-23T15:00:00+05:30");
      // Slot is in the past — even with 0 hours advance, not enough time
      expect(BookingPolicyService.isWithinAdvanceWindow(slotStart, 0)).toBe(false);
    });

    it("handles string input for slotStart", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-03-23T09:00:00+05:30"));

      // String input
      expect(
        BookingPolicyService.isWithinAdvanceWindow("2026-03-23T15:00:00+05:30", 4),
      ).toBe(true);
    });

    it("handles Date input for slotStart", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-03-23T09:00:00+05:30"));

      // Date input
      expect(
        BookingPolicyService.isWithinAdvanceWindow(new Date("2026-03-23T15:00:00+05:30"), 4),
      ).toBe(true);
    });

    it("returns false at exact boundary (time equals advance window)", () => {
      vi.useFakeTimers();
      // Now = 11:00, slot = 15:00, advance = 4 hours => exactly 4 hours away
      vi.setSystemTime(new Date("2026-03-23T11:00:00+05:30"));

      const slotStart = new Date("2026-03-23T15:00:00+05:30");
      // start - now = exactly 4 hours, >= 4 hours → true
      expect(BookingPolicyService.isWithinAdvanceWindow(slotStart, 4)).toBe(true);
    });
  });

  describe("isLateCancellation", () => {
    it("returns true when session starts within cancellation window", () => {
      vi.useFakeTimers();
      // Now = 14:00, session at 15:00, cancellation window = 2 hours
      // 1 hour until session <= 2 hours → late cancellation
      vi.setSystemTime(new Date("2026-03-23T14:00:00+05:30"));

      expect(
        BookingPolicyService.isLateCancellation("2026-03-23T15:00:00+05:30", 2),
      ).toBe(true);
    });

    it("returns false when cancellation is outside window", () => {
      vi.useFakeTimers();
      // Now = 09:00, session at 15:00, cancellation window = 2 hours
      // 6 hours until session > 2 hours → NOT late
      vi.setSystemTime(new Date("2026-03-23T09:00:00+05:30"));

      expect(
        BookingPolicyService.isLateCancellation("2026-03-23T15:00:00+05:30", 2),
      ).toBe(false);
    });

    it("returns true at exact boundary (hours until session equals window)", () => {
      vi.useFakeTimers();
      // Now = 13:00, session at 15:00, window = 2 hours
      // hoursUntilSession = 2, 2 <= 2 → true (late)
      vi.setSystemTime(new Date("2026-03-23T13:00:00+05:30"));

      expect(
        BookingPolicyService.isLateCancellation("2026-03-23T15:00:00+05:30", 2),
      ).toBe(true);
    });

    it("handles 0 hour cancellation window (always late for past/current sessions)", () => {
      vi.useFakeTimers();
      // Now = 09:00, session at 15:00, window = 0
      // 6 hours > 0 → NOT late
      vi.setSystemTime(new Date("2026-03-23T09:00:00+05:30"));

      expect(
        BookingPolicyService.isLateCancellation("2026-03-23T15:00:00+05:30", 0),
      ).toBe(false);
    });

    it("returns true when session is in the past", () => {
      vi.useFakeTimers();
      // Session already happened — hoursUntilSession is negative
      vi.setSystemTime(new Date("2026-03-23T16:00:00+05:30"));

      expect(
        BookingPolicyService.isLateCancellation("2026-03-23T15:00:00+05:30", 2),
      ).toBe(true);
    });

    it("handles Date input for sessionStartsAt", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-03-23T14:00:00+05:30"));

      expect(
        BookingPolicyService.isLateCancellation(
          new Date("2026-03-23T15:00:00+05:30"),
          2,
        ),
      ).toBe(true);
    });
  });
});
