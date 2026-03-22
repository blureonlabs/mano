import { describe, it, expect } from "vitest";
import {
  ConflictDetectionService,
  TimeRange,
} from "../scheduling/conflict-detection.service";

describe("ConflictDetectionService", () => {
  describe("overlaps", () => {
    it("returns true for two overlapping ranges", () => {
      const a: TimeRange = {
        start: "2026-03-23T09:00:00+05:30",
        end: "2026-03-23T10:00:00+05:30",
      };
      const b: TimeRange = {
        start: "2026-03-23T09:30:00+05:30",
        end: "2026-03-23T10:30:00+05:30",
      };
      expect(ConflictDetectionService.overlaps(a, b)).toBe(true);
    });

    it("returns false for two non-overlapping ranges", () => {
      const a: TimeRange = {
        start: "2026-03-23T09:00:00+05:30",
        end: "2026-03-23T10:00:00+05:30",
      };
      const b: TimeRange = {
        start: "2026-03-23T11:00:00+05:30",
        end: "2026-03-23T12:00:00+05:30",
      };
      expect(ConflictDetectionService.overlaps(a, b)).toBe(false);
    });

    it("returns false for adjacent ranges (end of A = start of B)", () => {
      // [aStart, aEnd) and [bStart, bEnd) — half-open intervals
      // aEnd == bStart → aStart < bEnd is true, but aEnd > bStart is false (equal, not greater)
      const a: TimeRange = {
        start: "2026-03-23T09:00:00+05:30",
        end: "2026-03-23T10:00:00+05:30",
      };
      const b: TimeRange = {
        start: "2026-03-23T10:00:00+05:30",
        end: "2026-03-23T11:00:00+05:30",
      };
      expect(ConflictDetectionService.overlaps(a, b)).toBe(false);
    });

    it("returns true for a fully contained range", () => {
      const outer: TimeRange = {
        start: "2026-03-23T09:00:00+05:30",
        end: "2026-03-23T12:00:00+05:30",
      };
      const inner: TimeRange = {
        start: "2026-03-23T10:00:00+05:30",
        end: "2026-03-23T11:00:00+05:30",
      };
      expect(ConflictDetectionService.overlaps(outer, inner)).toBe(true);
      expect(ConflictDetectionService.overlaps(inner, outer)).toBe(true);
    });

    it("returns true for partial overlap at start", () => {
      const a: TimeRange = {
        start: "2026-03-23T09:00:00+05:30",
        end: "2026-03-23T10:30:00+05:30",
      };
      const b: TimeRange = {
        start: "2026-03-23T10:00:00+05:30",
        end: "2026-03-23T11:00:00+05:30",
      };
      expect(ConflictDetectionService.overlaps(a, b)).toBe(true);
    });

    it("returns true for partial overlap at end", () => {
      const a: TimeRange = {
        start: "2026-03-23T10:00:00+05:30",
        end: "2026-03-23T11:00:00+05:30",
      };
      const b: TimeRange = {
        start: "2026-03-23T09:00:00+05:30",
        end: "2026-03-23T10:30:00+05:30",
      };
      expect(ConflictDetectionService.overlaps(a, b)).toBe(true);
    });

    it("returns true for identical ranges", () => {
      const a: TimeRange = {
        start: "2026-03-23T09:00:00+05:30",
        end: "2026-03-23T10:00:00+05:30",
      };
      const b: TimeRange = {
        start: "2026-03-23T09:00:00+05:30",
        end: "2026-03-23T10:00:00+05:30",
      };
      expect(ConflictDetectionService.overlaps(a, b)).toBe(true);
    });

    it("works with Date objects", () => {
      const a: TimeRange = {
        start: new Date("2026-03-23T09:00:00+05:30"),
        end: new Date("2026-03-23T10:00:00+05:30"),
      };
      const b: TimeRange = {
        start: new Date("2026-03-23T09:30:00+05:30"),
        end: new Date("2026-03-23T10:30:00+05:30"),
      };
      expect(ConflictDetectionService.overlaps(a, b)).toBe(true);
    });

    it("works with mixed string and Date inputs", () => {
      const a: TimeRange = {
        start: "2026-03-23T09:00:00+05:30",
        end: new Date("2026-03-23T10:00:00+05:30"),
      };
      const b: TimeRange = {
        start: new Date("2026-03-23T09:30:00+05:30"),
        end: "2026-03-23T10:30:00+05:30",
      };
      expect(ConflictDetectionService.overlaps(a, b)).toBe(true);
    });
  });

  describe("findConflicts", () => {
    it("returns matching conflicts from a list", () => {
      const proposed: TimeRange = {
        start: "2026-03-23T10:00:00+05:30",
        end: "2026-03-23T11:00:00+05:30",
      };
      const existing: TimeRange[] = [
        { start: "2026-03-23T09:00:00+05:30", end: "2026-03-23T10:00:00+05:30" }, // adjacent, no conflict
        { start: "2026-03-23T10:30:00+05:30", end: "2026-03-23T11:30:00+05:30" }, // overlaps
        { start: "2026-03-23T12:00:00+05:30", end: "2026-03-23T13:00:00+05:30" }, // no conflict
        { start: "2026-03-23T10:15:00+05:30", end: "2026-03-23T10:45:00+05:30" }, // contained, overlaps
      ];

      const conflicts = ConflictDetectionService.findConflicts(proposed, existing);
      expect(conflicts).toHaveLength(2);
      expect(conflicts).toContain(existing[1]);
      expect(conflicts).toContain(existing[3]);
    });

    it("returns empty array when no conflicts exist", () => {
      const proposed: TimeRange = {
        start: "2026-03-23T10:00:00+05:30",
        end: "2026-03-23T11:00:00+05:30",
      };
      const existing: TimeRange[] = [
        { start: "2026-03-23T08:00:00+05:30", end: "2026-03-23T09:00:00+05:30" },
        { start: "2026-03-23T12:00:00+05:30", end: "2026-03-23T13:00:00+05:30" },
      ];

      const conflicts = ConflictDetectionService.findConflicts(proposed, existing);
      expect(conflicts).toEqual([]);
    });

    it("returns empty array when existing list is empty", () => {
      const proposed: TimeRange = {
        start: "2026-03-23T10:00:00+05:30",
        end: "2026-03-23T11:00:00+05:30",
      };

      const conflicts = ConflictDetectionService.findConflicts(proposed, []);
      expect(conflicts).toEqual([]);
    });

    it("returns all items when all conflict", () => {
      const proposed: TimeRange = {
        start: "2026-03-23T09:00:00+05:30",
        end: "2026-03-23T17:00:00+05:30",
      };
      const existing: TimeRange[] = [
        { start: "2026-03-23T09:00:00+05:30", end: "2026-03-23T10:00:00+05:30" },
        { start: "2026-03-23T12:00:00+05:30", end: "2026-03-23T13:00:00+05:30" },
        { start: "2026-03-23T16:00:00+05:30", end: "2026-03-23T16:50:00+05:30" },
      ];

      const conflicts = ConflictDetectionService.findConflicts(proposed, existing);
      expect(conflicts).toHaveLength(3);
    });
  });
});
