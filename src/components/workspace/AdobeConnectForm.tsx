"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { Button } from "~/components/ui";
import { connectAdobe, disconnectAdobe } from "~/server/actions";

const FIELDS = [
  { name: "orgId", label: "Organization ID", placeholder: "1234ABCD…@AdobeOrg" },
  { name: "clientId", label: "Client ID (API key)", placeholder: "a1b2c3d4e5f6…" },
  { name: "clientSecret", label: "Client secret", placeholder: "p8e-AbCdEf…" },
] as const;

export const AdobeConnectForm = () => {
  /* Object identity changes per failure so repeated identical errors re-focus. */
  const [error, setError] = useState<{ message: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const errorRef = useRef<HTMLSpanElement>(null);
  const router = useRouter();

  /* Move focus to the failure message so keyboard and SR users land on it. */
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(async () => {
          setError(null);
          const result = await connectAdobe(data);
          if (!result.ok) {
            setError({ message: result.error ?? "Connection failed" });
          }
          router.refresh();
        });
      }}
    >
      {FIELDS.map((f) => (
        <label key={f.name} className="flex flex-col gap-1 text-sm">
          <span className="text-xs text-ink-faint">{f.label}</span>
          <input
            name={f.name}
            required
            type={f.name === "clientSecret" ? "password" : "text"}
            placeholder={f.placeholder}
            autoComplete={f.name === "clientSecret" ? "new-password" : "off"}
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
            className="border border-line bg-card px-3 py-2 text-sm focus:border-ink"
          />
        </label>
      ))}
      <div className="flex items-center gap-3">
        <Button variant="primary" disabled={pending} className="px-4 py-2">
          {pending ? "Validating with Adobe…" : "Connect Adobe"}
        </Button>
        <span
          ref={errorRef}
          tabIndex={-1}
          role="status"
          aria-live="polite"
          className="text-xs text-rust-text focus:outline-none"
        >
          {error?.message}
        </span>
      </div>
    </form>
  );
};

export const AdobeDisconnectButton = () => {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <Button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await disconnectAdobe();
          router.refresh();
        })
      }
    >
      {pending ? "Removing…" : "Disconnect Adobe"}
    </Button>
  );
};
