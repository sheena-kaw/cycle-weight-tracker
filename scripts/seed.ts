import { addDays, format, parseISO, subDays } from "date-fns";
import { eq } from "drizzle-orm";
import { createAuthClient } from "@neondatabase/auth";
import { db } from "../app/db";
import { periods, userInNeonAuth, weightEntries } from "../app/db/schema";

// The Next-aware `auth` instance in lib/auth/server.ts calls next/headers'
// cookies() internally, which only works inside a request scope — this
// script runs standalone via tsx, so it talks to Neon Auth directly instead.
const authClient = createAuthClient(process.env.NEON_AUTH_BASE_URL!);

/**
 * Creates (or reuses) one fixed demo account and replaces its weight/period
 * data with freshly generated sample data. Safe to re-run — only ever
 * touches rows belonging to the demo account's own user id.
 */

const DEMO_EMAIL = "demo@cycletracker.app";
const DEMO_PASSWORD = "CycleDemo2026!";
const DEMO_NAME = "Demo Account";

async function ensureDemoUser(): Promise<string> {
  const existing = await db
    .select({ id: userInNeonAuth.id })
    .from(userInNeonAuth)
    .where(eq(userInNeonAuth.email, DEMO_EMAIL))
    .limit(1);

  if (existing.length > 0) {
    return existing[0].id;
  }

  const { data, error } = await authClient.signUp.email(
    {
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      name: DEMO_NAME,
    },
    { headers: { origin: "http://localhost:3000" } }
  );

  if (error || !data?.user) {
    throw new Error(
      `[seed] Failed to create demo account: ${error?.message ?? "unknown error"}`
    );
  }

  // Skip email verification for the demo account so sign-in works immediately.
  await db
    .update(userInNeonAuth)
    .set({ emailVerified: true })
    .where(eq(userInNeonAuth.id, data.user.id));

  return data.user.id;
}

async function main() {
  const userId = await ensureDemoUser();

  await db.delete(periods).where(eq(periods.userId, userId));
  await db.delete(weightEntries).where(eq(weightEntries.userId, userId));

  const today = new Date();
  const historyStart = subDays(today, 120);

  // Periods roughly every 28 days, each lasting 5 days, with some natural variation.
  const generatedPeriods: { start_date: string; end_date: string }[] = [];
  let cursor = historyStart;
  while (cursor < today) {
    const start = cursor;
    const end = addDays(start, 4);
    generatedPeriods.push({
      start_date: format(start, "yyyy-MM-dd"),
      end_date: format(end, "yyyy-MM-dd"),
    });
    const cycleLength = 27 + Math.floor(Math.random() * 4); // 27-30 days
    cursor = addDays(start, cycleLength);
  }

  for (const p of generatedPeriods) {
    await db.insert(periods).values({
      userId,
      startDate: p.start_date,
      endDate: p.end_date,
    });
  }

  // A date is in the luteal phase when it falls in the 14 days before the next logged period start.
  function isLuteal(dateStr: string): boolean {
    const date = parseISO(dateStr);
    for (let i = 0; i < generatedPeriods.length - 1; i++) {
      const nextStart = parseISO(generatedPeriods[i + 1].start_date);
      const lutealStart = subDays(nextStart, 14);
      if (date >= lutealStart && date < nextStart) return true;
    }
    return false;
  }

  // Daily weights: a slow random walk around a baseline, with a modest luteal-phase bump
  // so the demo data actually shows the pattern the app is built to surface.
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
      await db.insert(weightEntries).values({ userId, date: dateStr, weight });
      inserted++;
    }

    day = addDays(day, 1);
  }

  console.log(
    `[seed] Inserted ${generatedPeriods.length} periods and ${inserted} weight entries for the demo account.`
  );
  console.log(`[seed] Demo login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
