"use client";

import { useState, useTransition } from "react";

import { buttonClass } from "~/components/ui";
import { captureEmail } from "~/server/actions";

export const EmailCapture = () => {
  const [state, setState] = useState<"idle" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (state === "done") {
    return (
      <p className="text-sm text-moss" role="status">
        Thanks — you will hear from us personally, nothing automated.
      </p>
    );
  }

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(async () => {
          const result = await captureEmail(data);
          if (result.ok) {
            setState("done");
          } else {
            setState("error");
            setMessage(result.error ?? "Something went wrong");
          }
        });
      }}
    >
      {/* Honeypot — hidden from humans, irresistible to bots. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />
      <input
        type="email"
        name="email"
        required
        placeholder="you@yourcompany.com"
        aria-label="Email address"
        className="min-w-56 flex-1 border border-line bg-card px-3 py-2.5 text-sm focus:border-ink"
      />
      <button disabled={pending} className={buttonClass("secondary")}>
        {pending ? "Sending…" : "Keep me posted"}
      </button>
      {state === "error" && (
        <span className="w-full text-xs text-rust-text" role="alert">
          {message}
        </span>
      )}
    </form>
  );
};
