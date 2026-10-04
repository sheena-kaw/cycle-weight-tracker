import { db } from "@/lib/db";
import type { WeightEntry } from "@/lib/types";

export function getWeights(): WeightEntry[] {
  return db
    .prepare("SELECT id, date, weight FROM weight_entries ORDER BY date ASC")
    .all() as WeightEntry[];
}

// Saves a weight entry for a given date.
// If an entry already exists for that date, updates it with the new weight.
export function upsertWeight(date: string, weight: number): void {
  db.prepare(
    `INSERT INTO weight_entries (date, weight) VALUES (?, ?)
     ON CONFLICT(date) DO UPDATE SET weight = excluded.weight`
  ).run(date, weight);
}

export function deleteWeight(id: number): void {
  db.prepare("DELETE FROM weight_entries WHERE id = ?").run(id);
}
