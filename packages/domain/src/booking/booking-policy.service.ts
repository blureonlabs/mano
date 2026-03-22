/**
 * BookingPolicyService — pure business rules for booking and cancellation policies.
 * No database dependencies; operates on values passed in.
 */

export class BookingPolicyService {
  /**
   * Check if a booking time satisfies the minimum advance booking window.
   * @returns true if the booking is allowed (enough advance time)
   */
  static isWithinAdvanceWindow(
    slotStart: Date | string,
    minAdvanceHours: number,
  ): boolean {
    const start =
      typeof slotStart === "string" ? new Date(slotStart) : slotStart;
    const minAdvanceMs = minAdvanceHours * 60 * 60_000;
    return start.getTime() - Date.now() >= minAdvanceMs;
  }

  /**
   * Check if a cancellation is late (within the cancellation window).
   * A cancellation is "late" when the session starts within `cancellationHours`
   * from now.
   */
  static isLateCancellation(
    sessionStartsAt: string | Date,
    cancellationHours: number,
  ): boolean {
    const sessionStart = new Date(sessionStartsAt).getTime();
    const hoursUntilSession = (sessionStart - Date.now()) / (1000 * 60 * 60);
    return hoursUntilSession <= cancellationHours;
  }
}
