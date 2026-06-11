"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "~/components/ui";
import { connectAdobe, disconnectAdobe } from "~/server/actions";

const FIELDS = [
  { name: "orgId", label: "Organization ID", placeholder: "1234ABCD…@AdobeOrg" },
  { name: "clientId", label: "Client ID (API key)", placeholder: "from the Developer Console project" },
  { name: "clientSecret", label: "Client secret", placeholder: "OAuth server-to-server" },
] as const;

export const AdobeConnectForm = () => {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(async () => {
          setError(null);
          const result = await connectAdobe(data);
          if (!result.ok) setError(result.error ?? "Connection failed");
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
            autoComplete="off"
            className="border border-line bg-card px-3 py-2 text-sm focus:border-ink"
          />
        </label>
      ))}
      <div className="flex items-center gap-3">
        <Button variant="primary" disabled={pending} className="px-4 py-2">
          {pending ? "Validating with Adobe…" : "Connect Adobe"}
        </Button>
        {error && <span className="text-xs text-rust-text">{error}</span>}
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
