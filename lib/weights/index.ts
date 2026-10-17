import { and, asc, eq } from "drizzle-orm";
import { db } from "@/app/db";
import { weightEntries } from "@/app/db/schema";
import type { WeightEntry } from "@/lib/types";

export async function getWeights(userId: string): Promise<WeightEntry[]> {
  return db
    .select({
      id: weightEntries.id,
      date: weightEntries.date,
      weight: weightEntries.weight,
    })
    .from(weightEntries)
    .where(eq(weightEntries.userId, userId))
    .orderBy(asc(weightEntries.date));
}

// Saves a weight entry for a given date for this user.
// If an entry already exists for that date, updates it with the new weight.
export async function upsertWeight(
  userId: string,
  date: string,
  weight: number
): Promise<void> {
  await db
    .insert(weightEntries)
    .values({ userId, date, weight })
    .onConflictDoUpdate({
      target: [weightEntries.userId, weightEntries.date],
      set: { weight },
    });
}

export async function deleteWeight(userId: string, id: number): Promise<void> {
  await db
    .delete(weightEntries)
    .where(and(eq(weightEntries.id, id), eq(weightEntries.userId, userId)));
}
