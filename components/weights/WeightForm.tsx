"use client";

import { useActionState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { logWeight } from "@/app/actions";

export function WeightForm() {
  const [error, formAction, isPending] = useActionState(logWeight, null);
  const formRef = useRef<HTMLFormElement>(null);
  const today = format(new Date(), "yyyy-MM-dd");

  // Resets the form back to its defaults after a successful submit (error === null
  // here means "last submit succeeded", not "hasn't submitted yet" — useActionState's
  // initial value is also null, so this runs harmlessly on mount too).
  useEffect(() => {
    if (!isPending && error === null) {
      formRef.current?.reset();
    }
  }, [isPending, error]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3 max-w-xs">
      <label className="flex flex-col gap-1">
        Date
        <input
          type="date"
          name="date"
          defaultValue={today}
          max={today}
          className="border rounded px-2 py-1"
        />
      </label>
      <label className="flex flex-col gap-1">
        Weight (lb)
        <input
          type="number"
          name="weight"
          step="0.1"
          min="0"
          required
          className="border rounded px-2 py-1"
        />
      </label>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="bg-foreground text-background rounded px-4 py-2 disabled:opacity-50"
      >
        {isPending ? "Saving..." : "Log weight"}
      </button>
    </form>
  );
}
