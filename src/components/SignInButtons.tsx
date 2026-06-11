"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

const MicrosoftMark = () => (
  <svg width="15" height="15" viewBox="0 0 21 21" aria-hidden="true">
    <rect x="0" y="0" width="10" height="10" fill="#F25022" />
    <rect x="11" y="0" width="10" height="10" fill="#7FBA00" />
    <rect x="0" y="11" width="10" height="10" fill="#00A4EF" />
    <rect x="11" y="11" width="10" height="10" fill="#FFB900" />
  </svg>
);

export const SignInButtons = ({
  entraConfigured,
  demoEnabled,
}: {
  entraConfigured: boolean;
  demoEnabled: boolean;
}) => {
  const [busy, setBusy] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={() => {
          setBusy("entra");
          void signIn("microsoft-entra-id", { redirectTo: "/app" });
        }}
        disabled={!entraConfigured || busy !== null}
        title={
          entraConfigured
            ? undefined
            : "Configure AUTH_MICROSOFT_ENTRA_ID_ID to enable Microsoft sign-in"
        }
        className="inline-flex items-center gap-2.5 bg-ink px-5 py-3 text-sm font-medium text-paper transition hover:bg-rust-deep disabled:cursor-not-allowed disabled:opacity-40"
      >
        <MicrosoftMark />
        {busy === "entra" ? "Redirecting…" : "Sign in with Microsoft"}
      </button>
      {demoEnabled && (
        <button
          onClick={() => {
            setBusy("demo");
            void signIn("demo", { redirectTo: "/app" });
          }}
          disabled={busy !== null}
          className="inline-flex items-center gap-2 border border-line-strong bg-card px-5 py-3 text-sm font-medium text-ink transition hover:border-ink disabled:opacity-50"
        >
          {busy === "demo" ? "Preparing demo…" : "Explore the demo workspace"}
        </button>
      )}
    </div>
  );
};
