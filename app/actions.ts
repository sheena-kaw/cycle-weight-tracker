"use server";

import { revalidatePath } from "next/cache";
import { format, isValid, parseISO, subYears } from "date-fns";
import { deleteWeight, upsertWeight } from "@/lib/weights";

// Signature matches useActionState's (prevState, formData) => newState contract.
// Returns null on success, or an error message string on failure.
export async function logWeight(
  _prevState: string | null,
  formData: FormData
): Promise<string | null> {
  const weightRaw = formData.get("weight");
  const weight = Number(weightRaw);

  // Logs below intentionally omit the actual weight value — only the event/reason, per CLAUDE.md.
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

  // The regex is required alongside isValid: parseISO is lenient and will
  // successfully parse some malformed/partial strings that aren't strict YYYY-MM-DD.
  if (!isValid(date) || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
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
