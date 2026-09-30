import { addDays, format, parseISO, subDays } from "date-fns";
import { DATA_MODE, db } from "../lib/db";

/**
 * This is a script that generates fake data and should only run in demo mode
 */

if (DATA_MODE !== "demo") {
  console.error(
    "[seed] Refusing to run: DATA_MODE must be 'demo' (got '" +
      DATA_MODE +
      "').",
  );
  process.exit(1);
}

db.exec("DELETE FROM weight_entries; DELETE FROM periods;");

const today = new Date();
const historyStart = subDays(today, 120);

// Periods roughly every 28 days, each lasting 5 days, with some natural variation.
const periods: { start_date: string; end_date: string }[] = [];
let cursor = historyStart;
while (cursor < today) {
  const start = cursor;
  const end = addDays(start, 4);
  periods.push({
    start_date: format(start, "yyyy-MM-dd"),
    end_date: format(end, "yyyy-MM-dd"),
  });
  const cycleLength = 27 + Math.floor(Math.random() * 4); // 27-30 days
  cursor = addDays(start, cycleLength);
}

const insertPeriod = db.prepare(
  "INSERT INTO periods (start_date, end_date) VALUES (?, ?)",
);

for (const p of periods) {
  insertPeriod.run(p.start_date, p.end_date);
}

// A date is in the luteal phase when it falls in the 14 days before the next logged period start.
function isLuteal(dateStr: string): boolean {
  const date = parseISO(dateStr);
  for (let i = 0; i < periods.length - 1; i++) {
    const nextStart = parseISO(periods[i + 1].start_date);
    const lutealStart = subDays(nextStart, 14);
    if (date >= lutealStart && date < nextStart) return true;
  }
  return false;
}

// Daily weights: a slow random walk around a baseline, with a modest luteal-phase bump
// so the demo data actually shows the pattern the app is built to surface.
const insertWeight = db.prepare(
  "INSERT INTO weight_entries (date, weight) VALUES (?, ?) ON CONFLICT(date) DO UPDATE SET weight = excluded.weight",
);

let baseline = 145;
let day = historyStart;
let inserted = 0;
while (day <= today) {
  const dateStr = format(day, "yyyy-MM-dd");

  baseline += (Math.random() - 0.5) * 0.3;
  const lutealBump = isLuteal(dateStr) ? 1.2 + Math.random() * 0.8 : 0;
  const noise = (Math.random() - 0.5) * 0.6;
  const weight = Math.round((baseline + lutealBump + noise) * 10) / 10;

  // Skip ~10% of days to look like a real person occasionally forgets to log.
  if (Math.random() > 0.1) {
    insertWeight.run(dateStr, weight);
    inserted++;
  }

  day = addDays(day, 1);
}

console.log(
  `[seed] Inserted ${periods.length} periods and ${inserted} weight entries into demo.db`,
);
