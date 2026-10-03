"use client";

import { useTransition } from "react";
import { deletePeriodAction } from "@/app/actions";

export function DeletePeriodButton({ id }: { id: number }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => deletePeriodAction(id))}
      disabled={isPending}
      className="text-red-600 text-sm disabled:opacity-50"
    >
      {isPending ? "Deleting..." : "Delete"}
    </button>
  );
}
