"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "~/components/ui";
import type { ConnectorSpec } from "~/lib/connectors";
import {
  connectSaasConnector,
  disconnectSaasConnector,
} from "~/server/actions";

export const SaasConnectForm = ({ spec }: { spec: ConnectorSpec }) => {
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
          const result = await connectSaasConnector(data);
          if (!result.ok) setError(result.error ?? "Connection failed");
          router.refresh();
        });
      }}
    >
      <input type="hidden" name="provider" value={spec.provider} />
      {spec.fields.map((f) => (
        <label key={f.name} className="flex flex-col gap-1 text-sm">
          <span className="text-xs text-ink-faint">{f.label}</span>
          <input
            name={f.name}
            required
            type={f.secret ? "password" : "text"}
            placeholder={f.placeholder}
            autoComplete="off"
            className="border border-line bg-card px-3 py-2 text-sm focus:border-ink"
          />
        </label>
      ))}
      <div className="flex items-center gap-3">
        <Button variant="primary" disabled={pending} className="px-4 py-2">
          {pending ? `Validating with ${spec.label}…` : spec.connectCta}
        </Button>
        {error && <span className="text-xs text-rust-text">{error}</span>}
      </div>
    </form>
  );
};

export const SaasDisconnectButton = ({ spec }: { spec: ConnectorSpec }) => {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <Button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await disconnectSaasConnector(spec.provider);
          router.refresh();
        })
      }
    >
      {pending ? "Removing…" : `Disconnect ${spec.label}`}
    </Button>
  );
};
