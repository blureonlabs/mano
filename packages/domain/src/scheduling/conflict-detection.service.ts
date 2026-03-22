/**
 * ConflictDetectionService — pure time-range overlap logic.
 * No database dependencies; operates on plain {start, end} objects.
 */

export interface TimeRange {
  start: Date | string;
  end: Date | string;
}

export class ConflictDetectionService {
  /**
   * Check if two time ranges overlap.
   * Two ranges [aStart, aEnd) and [bStart, bEnd) overlap when
   * aStart < bEnd AND aEnd > bStart.
   */
  static overlaps(a: TimeRange, b: TimeRange): boolean {
    const aStart = new Date(a.start).getTime();
    const aEnd = new Date(a.end).getTime();
    const bStart = new Date(b.start).getTime();
    const bEnd = new Date(b.end).getTime();
    return aStart < bEnd && aEnd > bStart;
  }

  /**
   * Return all items from `existing` that overlap with `proposed`.
   */
  static findConflicts(
    proposed: TimeRange,
    existing: TimeRange[],
  ): TimeRange[] {
    return existing.filter((e) =>
      ConflictDetectionService.overlaps(proposed, e),
    );
  }
}
