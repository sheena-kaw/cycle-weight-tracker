import { db } from "@/lib/db";
import type { WeightEntry } from "@/lib/types";

export function getWeights(): WeightEntry[] {
  return db
    .prepare("SELECT id, date, weight FROM weight_entries ORDER BY date ASC")
    .all() as WeightEntry[];
}
