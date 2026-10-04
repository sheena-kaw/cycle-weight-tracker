"use client";

import { useTransition } from "react";
import { deleteWeightAction } from "@/app/actions";

export function DeleteWeightButton({ id }: { id: number }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => deleteWeightAction(id))}
      disabled={isPending}
      className="text-red-600 text-sm disabled:opacity-50"
    >
      {isPending ? "Deleting..." : "Delete"}
    </button>
  );
}
