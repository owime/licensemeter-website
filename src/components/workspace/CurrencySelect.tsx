"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { setCurrency } from "~/server/actions";

export const CurrencySelect = ({ value }: { value: string }) => {
  const [pending, startTransition] = useTransition();
  const [current, setCurrent] = useState(value);
  const [lastValue, setLastValue] = useState(value);
  const inFlight = useRef(false);
  const router = useRouter();

  /* Re-sync if the server-confirmed currency changes underneath us. */
  if (lastValue !== value) {
    setLastValue(value);
    setCurrent(value);
  }

  return (
    <select
      value={current}
      aria-busy={pending || undefined}
      aria-label="Workspace currency"
      onChange={(e) => {
        const next = e.target.value;
        /* One mutation at a time, and none when re-selecting the current
           currency (arrowing through options fires change per step). */
        if (inFlight.current || next === current) return;
        inFlight.current = true;
        setCurrent(next);
        startTransition(async () => {
          try {
            const result = await setCurrency(next);
            if (!result.ok) {
              setCurrent(value);
              return;
            }
            router.refresh();
          } finally {
            inFlight.current = false;
          }
        });
      }}
      className={`border-line bg-card focus:border-ink border px-2 py-1.5 text-sm ${
        pending ? "opacity-60" : ""
      }`}
    >
      {["EUR", "USD", "GBP", "CHF"].map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
};
