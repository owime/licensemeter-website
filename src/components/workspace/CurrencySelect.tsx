"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { setCurrency } from "~/server/actions";

export const CurrencySelect = ({ value }: { value: string }) => {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <select
      defaultValue={value}
      disabled={pending}
      onChange={(e) =>
        startTransition(async () => {
          await setCurrency(e.target.value);
          router.refresh();
        })
      }
      className="border border-line bg-card px-2 py-1.5 text-sm focus:border-ink focus:outline-none"
      aria-label="Workspace currency"
    >
      {["EUR", "USD", "GBP", "CHF"].map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
};
