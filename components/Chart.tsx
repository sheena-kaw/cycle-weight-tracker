"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { eachDayOfInterval, format, parseISO, subDays } from "date-fns";
import { getPhaseForDate } from "@/lib/phases";
import type { Phase, PhaseRange, WeightEntry } from "@/lib/types";

const PHASE_COLORS: Record<Phase, string> = {
  menstrual: "#e11d48",
  follicular: "#3b82f6",
  ovulation: "#f59e0b",
  luteal: "#8b5cf6",
};

type WindowOption = "30" | "90" | "all";

type ChartProps = {
  weights: WeightEntry[];
  ranges: PhaseRange[];
};

type DayPoint = {
  date: string;
  weight: number | null;
  phase: Phase | null;
};

export function Chart({ weights, ranges }: ChartProps) {
  const [windowOption, setWindowOption] = useState<WindowOption>("30");

  const today = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

  const windowStart = useMemo(() => {
    if (windowOption === "30") {
      return format(subDays(parseISO(today), 29), "yyyy-MM-dd");
    }
    if (windowOption === "90") {
      return format(subDays(parseISO(today), 89), "yyyy-MM-dd");
    }

    // "all": earliest of the first logged weight, the first phase range, or today.
    const earliestWeight = weights.reduce<string | null>(
      (min, w) => (min === null || w.date < min ? w.date : min),
      null
    );
    const earliestRange = ranges.reduce<string | null>(
      (min, r) => (min === null || r.start < min ? r.start : min),
      null
    );
    const candidates = [earliestWeight, earliestRange, today].filter(
      (d): d is string => d !== null
    );
    return candidates.sort()[0];
  }, [windowOption, weights, ranges, today]);

  const weightByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const w of weights) map.set(w.date, w.weight);
    return map;
  }, [weights]);

  const data: DayPoint[] = useMemo(() => {
    const days = eachDayOfInterval({
      start: parseISO(windowStart),
      end: parseISO(today),
    });
    return days.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      return {
        date: dateStr,
        weight: weightByDate.get(dateStr) ?? null,
        phase: getPhaseForDate(dateStr, ranges)?.phase ?? null,
      };
    });
  }, [windowStart, today, weightByDate, ranges]);

  // Clip each range to the visible window so ReferenceArea never tries to
  // draw past the edges of the x-axis domain.
  const visibleRanges = useMemo(
    () =>
      ranges
        .filter((r) => r.end >= windowStart && r.start <= today)
        .map((r) => ({
          ...r,
          start: r.start < windowStart ? windowStart : r.start,
          end: r.end > today ? today : r.end,
        })),
    [ranges, windowStart, today]
  );

  const hasAnyWeight = data.some((d) => d.weight !== null);

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {(["30", "90", "all"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setWindowOption(option)}
            className={`px-3 py-1 rounded text-sm ${
              windowOption === option ? "bg-foreground text-background" : "border"
            }`}
          >
            {option === "all" ? "All time" : `${option}d`}
          </button>
        ))}
      </div>

      {ranges.length === 0 && (
        <p className="text-sm text-gray-500 mb-2">
          Log at least 2 periods to see phase shading on this chart.
        </p>
      )}

      {!hasAnyWeight ? (
        <p>No weights logged in this range yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} minTickGap={20} />
            <YAxis domain={["auto", "auto"]} tick={{ fontSize: 12 }} />
            <Tooltip content={<ChartTooltip />} />
            {visibleRanges.map((r) => (
              <ReferenceArea
                key={`${r.phase}-${r.start}`}
                x1={r.start}
                x2={r.end}
                fill={PHASE_COLORS[r.phase]}
                fillOpacity={r.estimated ? 0.1 : 0.25}
                stroke={PHASE_COLORS[r.phase]}
                strokeOpacity={r.estimated ? 0.4 : 0}
                strokeDasharray={r.estimated ? "4 2" : undefined}
              />
            ))}
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#111827"
              dot={false}
              connectNulls={true}
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      <div className="flex gap-4 mt-4 text-sm">
        {(Object.keys(PHASE_COLORS) as Phase[]).map((phase) => (
          <div key={phase} className="flex items-center gap-1">
            <span
              className="inline-block w-3 h-3 rounded-sm"
              style={{ backgroundColor: PHASE_COLORS[phase] }}
            />
            {phase}
          </div>
        ))}
      </div>
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: DayPoint }[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;

  return (
    <div className="bg-white border rounded p-2 text-sm shadow">
      <p className="font-semibold">{point.date}</p>
      <p>{point.weight !== null ? `${point.weight} lb` : "No entry"}</p>
      <p>{point.phase ?? "Unknown phase"}</p>
    </div>
  );
}
