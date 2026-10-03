# Cycle Weight Tracker

A local-only Next.js web app for logging daily weight and menstrual periods, then charting weight against estimated cycle phases to show whether weight changes line up with the cycle (especially the luteal phase).

## Scope

- Single user, runs on localhost only
- No authentication, no deployment
- GitHub for collaboration (feature branches + pull requests)

Out of scope: login, deployment, multiple users, kg/lb switching, symptom tracking, period predictions, notifications, data export. Do not add these unless asked.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- SQLite via `better-sqlite3` (synchronous, raw SQL, **no ORM**)
- Recharts (charting)
- date-fns (all date math)
- Vitest (unit tests)
- tsx (runs scripts)

Do not add new dependencies without asking first.

## Commands

```bash
npm run dev        # run with real data (dev.db)
npm run demo       # regenerate sample data, then run with it
npm run dev:demo   # run with existing sample data (demo.db)
npm run seed       # regenerate sample data only
npm test           # run Vitest
```

## Data modes

- `DATA_MODE=demo` → `demo.db` (sample data). Otherwise → `dev.db` (real data).
- `lib/db.ts` picks the file; all other code just imports `db`.
- The seed script must refuse to run unless `DATA_MODE === "demo"`. It must never touch `dev.db`.
- A banner in `app/layout.tsx` shows when demo mode is active.
- `*.db` files are gitignored.

## Database

```sql
weight_entries (id INTEGER PK, date TEXT UNIQUE NOT NULL, weight REAL NOT NULL CHECK (weight > 0))
periods        (id INTEGER PK, start_date TEXT UNIQUE NOT NULL, end_date TEXT NULL,
                CHECK (end_date IS NULL OR end_date >= start_date))
```

- Tables are created in `lib/db.ts` with `CREATE TABLE IF NOT EXISTS`.
- One weight per date: logging the same date again replaces it (`INSERT ... ON CONFLICT(date) DO UPDATE`).
- Phases are **calculated** from periods, never stored.
- Always use `?` placeholders. Never build SQL with string concatenation.

## File structure

```
app/
  layout.tsx          server — shell, nav, demo banner
  page.tsx            server — dashboard: fetch data, run phases + insights
  actions.ts          "use server" — all server actions
  history/page.tsx    server — weight history
  periods/page.tsx    server — period form + list
components/           UI pieces; client components marked "use client"
lib/
  db.ts               opens database, creates tables
  types.ts            WeightEntry, Period, Phase, PhaseRange
  weights.ts          getWeights, upsertWeight, deleteWeight
  periods.ts          getPeriods, addPeriod, updatePeriod, deletePeriod
  phases.ts           getPhaseRanges, getPhaseForDate (pure logic)
  insights.ts         average weight per phase (pure logic)
  *.test.ts           Vitest tests
scripts/
  seed.ts             fills demo.db with sample data
```

## Architecture rules

- **Data functions** (`lib/weights.ts`, `lib/periods.ts`): one SQL query each, no validation, no knowledge of forms or pages.
- **Server actions** (`app/actions.ts`): receive form input → validate → call a data function → `revalidatePath` → return an error message on failure.
- **Server components** (default): read data by calling data functions directly.
- **Client components** (`"use client"`): only for interactivity (forms with error/pending state, chart, buttons with handlers). Never import `lib/db.ts` or data functions.
- Props passed from server to client components must be plain, serializable data (strings, numbers, arrays, plain objects). No `Date` objects or functions.
- `phases.ts` and `insights.ts` are pure TypeScript with no database or React imports, so they are easy to test.

## Dates

- Store and pass dates as `'YYYY-MM-DD'` strings everywhere.
- Use date-fns for all date math: `parseISO`, `format(d, "yyyy-MM-dd")`, `addDays`, `subDays`, `differenceInCalendarDays`, `eachDayOfInterval`, `isAfter`.
- Never use `toISOString()` for dates (it converts to UTC and causes off-by-one-day bugs).

## Validation rules

**Weight**
- Required, must be a finite number (reject letters). Check on the server with `Number()` + `Number.isFinite()`; the UI uses `<input type="number" step="0.1" min="0">` for convenience only.
- Greater than 0 and at most 1000 lb. Round to one decimal place on save.

**Weight date**
- Required (defaults to today), valid `YYYY-MM-DD`.
- Not in the future. Not more than 1 year in the past.

**Periods**
- Start date required, not in the future, not a duplicate.
- End date optional; if given, on or after the start date.

On invalid input: save nothing, return a clear message, and keep the user's input in the form.

## Phase logic (`lib/phases.ts`)

For each period and the next period start:
- **Menstrual:** start → end (assume start + 4 days if no end is logged)
- **Luteal:** the 14 days before the next period start
- **Ovulation:** first 1–2 days of the luteal window
- **Follicular:** days between menstrual and ovulation
- **Overlap:** menstrual wins (very short cycles)
- **Current cycle:** estimate the next start from the average length of completed cycles; mark those ranges `estimated: true`
- Fewer than 2 periods logged → no phases; UI explains why

Write tests first for: normal cycle, day boundaries, missing end date, single period, short cycle, estimated current cycle.

## Insight (`lib/insights.ts`)

- Label each weight with its phase, excluding estimated days.
- Average weight per phase; show luteal minus follicular difference (e.g. "+1.2 lb in your luteal phase").
- Only show once at least one complete cycle has weights in both phases; otherwise show "Keep logging to see your pattern."

## Chart

- Client component using Recharts `LineChart`.
- One data point per calendar day in range (`weight` or `null`) so `ReferenceArea` phase bands align with the x-axis.
- Shaded `ReferenceArea` per phase range; lighter/striped when estimated.
- Tooltip shows date, weight, phase. Legend for phase colors. 30 / 90 / all-time toggle.

## Logging

- `console.log` / `console.error` in server actions with a consistent prefix, e.g. `[logWeight]`.
- Log events (saved, rejected + reason, unexpected error), **not** the weight or health values themselves.

## UI notes

- Tailwind, clean and simple, works at phone width.
- Empty states for no weights, no periods, and too few periods for phases.
- Show a note that phases are estimates, not medical advice.

## How to work in this repo

- Make small, focused changes: one function or component at a time.
- Follow the existing patterns and the rules above rather than inventing new ones.
- Explain what changed and why in a few sentences after each change.
- If a request conflicts with these rules or needs a new dependency, ask first.

## Build order

1. Data layer (`lib/db.ts`, `lib/types.ts`), npm scripts
2. Seed script; verify `demo.db` has realistic data
3. Basic server component listing weights (end-to-end proof: SQLite → Next.js → browser)
4. Weight logging: data functions → server action with validation → `WeightForm`
5. Weight history + delete
6. Periods (same pattern)
7. Phase logic + tests
8. Today's status
9. Chart
10. Insight card + polish

Nice to have if time allows: period calendar view, inline weight editing, Vitest tests for `lib/weights.ts`/`lib/periods.ts` data functions against an in-memory `better-sqlite3` instance (not required now — `phases.ts`/`insights.ts` pure-logic tests are the priority).