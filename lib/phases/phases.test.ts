import { describe, expect, it } from "vitest";
import { addDays, format, parseISO } from "date-fns";
import type { Period, PhaseRange } from "@/lib/types";
import { getPhaseForDate, getPhaseRanges } from "./index";

function period(
  id: number,
  startDate: string,
  endDate: string | null
): Period {
  return { id, start_date: startDate, end_date: endDate };
}

// Asserts the ranges are a closed-interval, gap-free, non-overlapping
// partition of the timeline — every day belongs to exactly one phase.
function expectContiguous(ranges: PhaseRange[]) {
  const sorted = [...ranges].sort((a, b) => a.start.localeCompare(b.start));
  for (let i = 1; i < sorted.length; i++) {
    const expectedStart = format(
      addDays(parseISO(sorted[i - 1].end), 1),
      "yyyy-MM-dd"
    );
    expect(sorted[i].start).toBe(expectedStart);
  }
}

describe("getPhaseRanges", () => {
  it("returns no ranges with fewer than 2 periods logged", () => {
    expect(getPhaseRanges([])).toEqual([]);
    expect(getPhaseRanges([period(1, "2024-01-01", "2024-01-05")])).toEqual(
      []
    );
  });

  it("computes a normal 28-day cycle", () => {
    const periods = [
      period(1, "2024-01-01", "2024-01-05"),
      period(2, "2024-01-29", "2024-02-02"),
    ];

    const ranges = getPhaseRanges(periods);
    const cycle1 = ranges.filter((r) => r.start < "2024-01-29");

    expect(cycle1).toEqual([
      { phase: "menstrual", start: "2024-01-01", end: "2024-01-05", estimated: false },
      { phase: "follicular", start: "2024-01-06", end: "2024-01-14", estimated: false },
      { phase: "ovulation", start: "2024-01-15", end: "2024-01-16", estimated: false },
      { phase: "luteal", start: "2024-01-17", end: "2024-01-28", estimated: false },
    ]);
    expectContiguous(ranges);
  });

  it("resolves phase boundaries to exactly the right phase, on both sides", () => {
    const periods = [
      period(1, "2024-01-01", "2024-01-05"),
      period(2, "2024-01-29", "2024-02-02"),
    ];
    const ranges = getPhaseRanges(periods);

    expect(getPhaseForDate("2024-01-05", ranges)?.phase).toBe("menstrual");
    expect(getPhaseForDate("2024-01-06", ranges)?.phase).toBe("follicular");
    expect(getPhaseForDate("2024-01-14", ranges)?.phase).toBe("follicular");
    expect(getPhaseForDate("2024-01-15", ranges)?.phase).toBe("ovulation");
    expect(getPhaseForDate("2024-01-16", ranges)?.phase).toBe("ovulation");
    expect(getPhaseForDate("2024-01-17", ranges)?.phase).toBe("luteal");
    expect(getPhaseForDate("2024-01-28", ranges)?.phase).toBe("luteal");
    expect(getPhaseForDate("2024-01-29", ranges)?.phase).toBe("menstrual");
  });

  it("defaults a missing end date to start + 4 days", () => {
    const periods = [
      period(1, "2024-01-01", null),
      period(2, "2024-01-29", "2024-02-02"),
    ];

    const menstrual = getPhaseRanges(periods).find(
      (r) => r.phase === "menstrual" && r.start === "2024-01-01"
    );
    expect(menstrual?.end).toBe("2024-01-05");
  });

  it("gives menstrual priority and drops follicular on a short cycle", () => {
    const periods = [
      period(1, "2024-01-01", "2024-01-05"),
      period(2, "2024-01-16", "2024-01-20"),
    ];

    const ranges = getPhaseRanges(periods);
    const cycle1 = ranges.filter((r) => r.start < "2024-01-16");

    expect(cycle1).toEqual([
      { phase: "menstrual", start: "2024-01-01", end: "2024-01-05", estimated: false },
      { phase: "ovulation", start: "2024-01-06", end: "2024-01-07", estimated: false },
      { phase: "luteal", start: "2024-01-08", end: "2024-01-15", estimated: false },
    ]);
    expectContiguous(ranges);
  });

  it("marks the current (last) cycle as estimated, using the average of completed cycles", () => {
    const periods = [
      period(1, "2024-01-01", "2024-01-05"),
      period(2, "2024-01-29", "2024-02-02"),
      period(3, "2024-02-26", "2024-03-01"),
    ];

    const ranges = getPhaseRanges(periods);

    const completed = ranges.filter((r) => r.start < "2024-02-26");
    const current = ranges.filter((r) => r.start >= "2024-02-26");

    expect(completed.every((r) => r.estimated === false)).toBe(true);
    expect(current.length).toBeGreaterThan(0);
    expect(current.every((r) => r.estimated === true)).toBe(true);

    // Average gap is 28 days (both completed cycles), so the estimated
    // next start is 2024-02-26 + 28 = 2024-03-25, meaning the last
    // estimated range (luteal) should end the day before that.
    const lastRange = [...current].sort((a, b) => a.end.localeCompare(b.end))[
      current.length - 1
    ];
    expect(lastRange.end).toBe("2024-03-24");

    expectContiguous(ranges);
  });
});

describe("getPhaseForDate", () => {
  it("returns null for a date outside any range", () => {
    const periods = [
      period(1, "2024-01-01", "2024-01-05"),
      period(2, "2024-01-29", "2024-02-02"),
    ];
    const ranges = getPhaseRanges(periods);

    expect(getPhaseForDate("2023-12-31", ranges)).toBeNull();
  });

  it("returns null when there are no ranges at all", () => {
    expect(getPhaseForDate("2024-01-01", [])).toBeNull();
  });

  it("reports whether the matched range is estimated", () => {
    const periods = [
      period(1, "2024-01-01", "2024-01-05"),
      period(2, "2024-01-29", "2024-02-02"),
    ];
    const ranges = getPhaseRanges(periods);

    // A date within the completed first cycle.
    expect(getPhaseForDate("2024-01-10", ranges)?.estimated).toBe(false);
    // A date within the last (current, projected) cycle.
    expect(getPhaseForDate("2024-01-29", ranges)?.estimated).toBe(true);
  });
});
