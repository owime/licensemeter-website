"use client";

import { useState, useTransition } from "react";

import { disconnectTenant } from "~/server/actions";

export const DangerZone = ({ tenantName }: { tenantName: string }) => {
  const [armed, setArmed] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div className="border border-rust-soft bg-card">
      <div className="border-b border-rust-soft px-5 py-3">
        <h3 className="text-xs font-medium tracking-[0.18em] text-rust-deep uppercase">
          Danger zone
        </h3>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
        <p className="max-w-md text-sm text-ink-soft">
          Disconnecting deletes every synced record for {tenantName} — users,
          findings, prices, history. The admin consent in your tenant can then
          be revoked under Enterprise applications.
        </p>
        {armed ? (
          <div className="flex items-center gap-2">
            <button
              disabled={pending}
              onClick={() => startTransition(async () => void (await disconnectTenant()))}
              className="bg-rust px-4 py-2 text-xs font-medium tracking-wide text-paper uppercase hover:bg-rust-deep disabled:opacity-50"
            >
              {pending ? "Deleting…" : "Yes, delete everything"}
            </button>
            <button
              onClick={() => setArmed(false)}
              className="border border-line-strong px-4 py-2 text-xs font-medium tracking-wide uppercase"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setArmed(true)}
            className="border border-rust px-4 py-2 text-xs font-medium tracking-wide text-rust-text uppercase hover:bg-rust-soft"
          >
            Disconnect workspace
          </button>
        )}
      </div>
    </div>
  );
};
