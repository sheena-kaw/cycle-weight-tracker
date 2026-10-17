import { and, asc, eq } from "drizzle-orm";
import { db } from "@/app/db";
import { periods } from "@/app/db/schema";
import type { Period } from "@/lib/types";

export async function getPeriods(userId: string): Promise<Period[]> {
  return db
    .select({
      id: periods.id,
      start_date: periods.startDate,
      end_date: periods.endDate,
    })
    .from(periods)
    .where(eq(periods.userId, userId))
    .orderBy(asc(periods.startDate));
}

export async function addPeriod(
  userId: string,
  startDate: string,
  endDate: string | null
): Promise<void> {
  await db.insert(periods).values({ userId, startDate, endDate });
}

export async function updatePeriod(
  userId: string,
  id: number,
  startDate: string,
  endDate: string | null
): Promise<void> {
  await db
    .update(periods)
    .set({ startDate, endDate })
    .where(and(eq(periods.id, id), eq(periods.userId, userId)));
}

export async function deletePeriod(userId: string, id: number): Promise<void> {
  await db
    .delete(periods)
    .where(and(eq(periods.id, id), eq(periods.userId, userId)));
}
