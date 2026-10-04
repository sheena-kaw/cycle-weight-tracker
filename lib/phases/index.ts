import { addDays, differenceInCalendarDays, format, parseISO, subDays } from "date-fns";
import type { Period, Phase, PhaseRange } from "@/lib/types";

function toDateStr(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

// Pure logic, no database or React imports (see CLAUDE.md) — every "current
// time" concern is an explicit argument, never new Date()/Date.now(), so
// this stays fully deterministic and needs no mocking in tests.
export function getPhaseRanges(periods: Period[]): PhaseRange[] {
  if (periods.length < 2) return [];

  // Sort defensively rather than trusting the caller already did.
  const sorted = [...periods].sort((a, b) =>
    a.start_date.localeCompare(b.start_date)
  );

  const ranges: PhaseRange[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const isLast = i === sorted.length - 1;

    let nextStartStr: string;
    let estimated: boolean;

    if (!isLast) {
      nextStartStr = sorted[i + 1].start_date;
      estimated = false;
    } else {
      // Estimate the next start from the average length of completed
      // cycles (the gaps between consecutive logged start dates).
      const gaps: number[] = [];
      for (let j = 1; j < sorted.length; j++) {
        gaps.push(
          differenceInCalendarDays(
            parseISO(sorted[j].start_date),
            parseISO(sorted[j - 1].start_date)
          )
        );
      }
      const avgGap = Math.round(
        gaps.reduce((a, b) => a + b, 0) / gaps.length
      );
      nextStartStr = toDateStr(addDays(parseISO(current.start_date), avgGap));
      estimated = true;
    }

    const start = parseISO(current.start_date);
    const nextStart = parseISO(nextStartStr);
    const nextStartMinus1 = subDays(nextStart, 1);
    const menstrualEnd = current.end_date
      ? parseISO(current.end_date)
      : addDays(start, 4);

    ranges.push({
      phase: "menstrual",
      start: current.start_date,
      end: toDateStr(menstrualEnd),
      estimated,
    });

    const lutealStart = subDays(nextStart, 14);

    // "Menstrual wins" on a short cycle: if there's no room left for a
    // follicular phase between the end of menstrual and the start of the
    // luteal window, omit it entirely rather than emitting a negative or
    // zero-length range.
    const follicularStart = addDays(menstrualEnd, 1);
    const follicularEnd = subDays(lutealStart, 1);
    if (follicularStart <= follicularEnd) {
      ranges.push({
        phase: "follicular",
        start: toDateStr(follicularStart),
        end: toDateStr(follicularEnd),
        estimated,
      });
    }

    // ovulationStart = max(lutealStart, menstrualEnd + 1)
    const ovulationStart =
      lutealStart > menstrualEnd ? lutealStart : addDays(menstrualEnd, 1);
    // ovulationEnd = min(ovulationStart + 1, nextStart - 1)
    const ovulationEndCandidate = addDays(ovulationStart, 1);
    const ovulationEnd =
      ovulationEndCandidate < nextStartMinus1
        ? ovulationEndCandidate
        : nextStartMinus1;

    ranges.push({
      phase: "ovulation",
      start: toDateStr(ovulationStart),
      end: toDateStr(ovulationEnd),
      estimated,
    });

    const lutealPhaseStart = addDays(ovulationEnd, 1);
    const lutealPhaseEnd = nextStartMinus1;
    if (lutealPhaseStart <= lutealPhaseEnd) {
      ranges.push({
        phase: "luteal",
        start: toDateStr(lutealPhaseStart),
        end: toDateStr(lutealPhaseEnd),
        estimated,
      });
    }
  }

  return ranges;
}
export function getPhaseForDate(
  date: string,
  ranges: PhaseRange[]
): { phase: Phase; estimated: boolean } | null {
  const match = ranges.find((r) => date >= r.start && date <= r.end);
  return match ? { phase: match.phase, estimated: match.estimated } : null;
}
