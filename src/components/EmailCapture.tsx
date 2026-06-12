"use client";

import { useRef, useState, useTransition } from "react";

import { buttonClass } from "~/components/ui";
import { captureEmail } from "~/server/actions";

export const EmailCapture = () => {
  const [state, setState] = useState<"idle" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);

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
            setMessage(
              "Sent — the guide and the security one-pager are on their way to your inbox.",
            );
            // The fields hide on success — park focus on the confirmation
            // before the commit so it is never dropped to <body>.
            statusRef.current?.focus();
          } else {
            setState("error");
            setMessage(
              result.error ?? "Something went wrong — please try again.",
            );
            inputRef.current?.focus();
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
        ref={inputRef}
        type="email"
        name="email"
        required
        placeholder="you@yourcompany.com"
        aria-label="Email address"
        aria-invalid={state === "error" || undefined}
        autoComplete="email"
        spellCheck={false}
        className={`min-h-11 min-w-56 flex-1 border border-line bg-card px-3 py-2.5 text-sm focus:border-ink ${
          state === "done" ? "hidden" : ""
        }`}
      />
      <button
        disabled={pending}
        className={buttonClass("secondary", state === "done" ? "hidden" : "")}
      >
        {pending ? "Sending…" : "Send me the guide"}
      </button>
      {/* Live region mounted from first render so announcements are reliable. */}
      <p
        ref={statusRef}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className={
          state === "done"
            ? "text-sm text-moss"
            : state === "error"
              ? "w-full text-xs text-rust-text"
              : "sr-only"
        }
      >
        {message}
      </p>
    </form>
  );
};
