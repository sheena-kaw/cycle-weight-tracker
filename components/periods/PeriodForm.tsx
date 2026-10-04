"use client";

import { useActionState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { addPeriodAction } from "@/app/actions";

export function PeriodForm() {
  const [error, formAction, isPending] = useActionState(addPeriodAction, null);
  const formRef = useRef<HTMLFormElement>(null);
  const today = format(new Date(), "yyyy-MM-dd");

  // See WeightForm for why this effect also runs harmlessly on mount.
  useEffect(() => {
    if (!isPending && error === null) {
      formRef.current?.reset();
    }
  }, [isPending, error]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3 max-w-xs">
      <label className="flex flex-col gap-1">
        Start date
        <input
          type="date"
          name="start_date"
          defaultValue={today}
          max={today}
          className="border rounded px-2 py-1"
        />
      </label>
      <label className="flex flex-col gap-1">
        End date (optional)
        <input
          type="date"
          name="end_date"
          max={today}
          className="border rounded px-2 py-1"
        />
      </label>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="bg-foreground text-background rounded px-4 py-2 disabled:opacity-50"
      >
        {isPending ? "Saving..." : "Log period"}
      </button>
    </form>
  );
}
