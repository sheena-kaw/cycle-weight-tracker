import { db } from "@/lib/db";
import type { Period } from "@/lib/types";

export function getPeriods(): Period[] {
  return db
    .prepare("SELECT id, start_date, end_date FROM periods ORDER BY start_date ASC")
    .all() as Period[];
}

export function addPeriod(startDate: string, endDate: string | null): void {
  db.prepare("INSERT INTO periods (start_date, end_date) VALUES (?, ?)").run(
    startDate,
    endDate
  );
}

export function updatePeriod(
  id: number,
  startDate: string,
  endDate: string | null
): void {
  db.prepare(
    "UPDATE periods SET start_date = ?, end_date = ? WHERE id = ?"
  ).run(startDate, endDate, id);
}

export function deletePeriod(id: number): void {
  db.prepare("DELETE FROM periods WHERE id = ?").run(id);
}
