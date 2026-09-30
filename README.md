# Cycle Weight Tracker

A local-only Next.js app for logging daily weight and menstrual periods, then charting weight against estimated cycle phases.

See [CLAUDE.md](./CLAUDE.md) for the full spec, architecture rules, and build order.

## Getting started

```bash
git clone <this-repo-url>
cd cycle-weight-tracker
npm install
```

Then pick one of the run modes below.

## Running the app

This app uses a real database (`dev.db`) by default, or a demo database (`demo.db`) filled with sample data — see [Data modes](#data-modes).

**With sample data (recommended for a first look):**
```bash
npm run demo
```
This regenerates realistic sample periods/weights and starts the dev server against `demo.db`.

**With your own real data:**
```bash
npm run dev
```
This starts the dev server against `dev.db`, which starts empty.

Either way, open [http://localhost:3000](http://localhost:3000) in your browser.

## Data modes

| Script | Database | What it does |
| --- | --- | --- |
| `npm run dev` | `dev.db` | Runs the app with your real data |
| `npm run demo` | `demo.db` | Regenerates sample data, then runs the app with it |
| `npm run dev:demo` | `demo.db` | Runs the app with whatever sample data is already there (skips reseeding) |
| `npm run seed` | `demo.db` | Regenerates sample data only, without starting the app |

`*.db` files are gitignored, so everyone who clones the repo starts with a clean `dev.db` and generates their own `demo.db` via `npm run seed`.

## Stack

Next.js (App Router) + TypeScript, Tailwind CSS, SQLite (`better-sqlite3`), Recharts, date-fns
