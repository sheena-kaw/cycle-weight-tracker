"use server";

import { revalidatePath } from "next/cache";
import { addDays, format, isValid, parseISO, subYears } from "date-fns";
import { deleteWeight, upsertWeight } from "@/lib/weights";
import { addPeriod, deletePeriod, getPeriods } from "@/lib/periods";

// parseISO is lenient and will successfully parse some malformed/partial
// strings that aren't strict YYYY-MM-DD, so the regex check is required too.
function isValidDateString(value: string): boolean {
  return isValid(parseISO(value)) && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

// Signature matches useActionState's (prevState, formData) => newState contract.
// Returns null on success, or an error message string on failure.
export async function logWeight(
  _prevState: string | null,
  formData: FormData
): Promise<string | null> {
  const weightRaw = formData.get("weight");
  const weight = Number(weightRaw);

  // Logs below intentionally omit the actual weight value — only the event/reason
  if (!weightRaw || !Number.isFinite(weight)) {
    console.error("[logWeight] rejected: weight is not a valid number");
    return "Weight must be a number.";
  }

  if (weight <= 0 || weight > 1000) {
    console.error("[logWeight] rejected: weight out of range");
    return "Weight must be greater than 0 and at most 1000 lb.";
  }

  const dateRaw = formData.get("date");
  const dateStr =
    typeof dateRaw === "string" && dateRaw.length > 0
      ? dateRaw
      : format(new Date(), "yyyy-MM-dd");

  const date = parseISO(dateStr);
  const today = new Date();

  if (!isValidDateString(dateStr)) {
    console.error("[logWeight] rejected: invalid date format");
    return "Date must be a valid date.";
  }

  if (date > today) {
    console.error("[logWeight] rejected: date is in the future");
    return "Date cannot be in the future.";
  }

  if (date < subYears(today, 1)) {
    console.error("[logWeight] rejected: date is more than 1 year in the past");
    return "Date cannot be more than 1 year ago.";
  }

  const roundedWeight = Math.round(weight * 10) / 10;

  try {
    upsertWeight(dateStr, roundedWeight);
  } catch (error) {
    console.error("[logWeight] unexpected error", error);
    return "Something went wrong saving your weight. Please try again.";
  }

  console.log("[logWeight] saved weight entry");
  revalidatePath("/");
  revalidatePath("/history");
  return null;
}

// Unlike logWeight, this is called directly from a client event handler
// (e.g. a delete button's onClick), not from a <form action>, so it takes
// a plain id argument instead of FormData.
export async function deleteWeightAction(id: number): Promise<void> {
  deleteWeight(id);
  revalidatePath("/history");
}

// A missing end date is treated as start + 4 days for this check only — the
// same assumption lib/phases.ts uses for an unfinished menstrual window —
// so an ongoing period blocks genuinely overlapping entries without
// permanently blocking everything after it.
export async function addPeriodAction(
  _prevState: string | null,
  formData: FormData
): Promise<string | null> {
  const startRaw = formData.get("start_date");
  const startDate = typeof startRaw === "string" ? startRaw : "";

  if (!startDate || !isValidDateString(startDate)) {
    console.error("[addPeriod] rejected: invalid start date");
    return "Start date must be a valid date.";
  }

  const start = parseISO(startDate);
  const today = new Date();

  if (start > today) {
    console.error("[addPeriod] rejected: start date is in the future");
    return "Start date cannot be in the future.";
  }

  const endRaw = formData.get("end_date");
  const endDate =
    typeof endRaw === "string" && endRaw.length > 0 ? endRaw : null;

  if (endDate !== null) {
    if (!isValidDateString(endDate)) {
      console.error("[addPeriod] rejected: invalid end date");
      return "End date must be a valid date.";
    }

    const end = parseISO(endDate);

    // Period predictions are explicitly out of scope 
    // (AS OF RIGHT could be added as an additional feature later)
    if (end > today) {
      console.error("[addPeriod] rejected: end date is in the future");
      return "End date cannot be in the future.";
    }

    if (end < start) {
      console.error("[addPeriod] rejected: end date before start date");
      return "End date must be on or after the start date.";
    }
  }

  const proposedEnd = endDate ? parseISO(endDate) : addDays(start, 4);

  const overlaps = getPeriods().some((p) => {
    const existingStart = parseISO(p.start_date);
    const existingEnd = p.end_date
      ? parseISO(p.end_date)
      : addDays(existingStart, 4);
    return start <= existingEnd && existingStart <= proposedEnd;
  });

  if (overlaps) {
    console.error("[addPeriod] rejected: overlaps an existing period");
    return "This period overlaps with one you've already logged.";
  }

  try {
    addPeriod(startDate, endDate);
  } catch (error) {
    console.error("[addPeriod] unexpected error", error);
    return "Something went wrong saving this period. Please try again.";
  }

  console.log("[addPeriod] saved period");
  revalidatePath("/periods");
  return null;
}

export async function deletePeriodAction(id: number): Promise<void> {
  deletePeriod(id);
  revalidatePath("/periods");
}
