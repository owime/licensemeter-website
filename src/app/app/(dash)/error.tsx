"use client";

import { Button, ButtonLink } from "~/components/ui";

/** Dash-level error boundary. No internals on screen, just a way back. */
export default function DashError({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto max-w-4xl">
      <div
        role="alert"
        className="bg-danger-soft text-danger-text flex items-start gap-4 rounded-2xl px-5 py-4"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 20 20"
          aria-hidden="true"
          className="mt-0.5 shrink-0"
        >
          <path
            d="M10 2.5 18 16.5H2L10 2.5Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M10 8v3.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="10" cy="14" r="0.9" fill="currentColor" />
        </svg>
        <div>
          <h1 className="font-display text-2xl tracking-tight">
            Something went wrong
          </h1>
          <p className="mt-1 max-w-md text-sm">
            This page failed to load. Your data is unaffected. Try again, and if
            it keeps happening, sign out and back in.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => reset()}>Try again</Button>
            <ButtonLink href="/app">Open Overview</ButtonLink>
            <ButtonLink href="/app/settings/sync-history">
              Check Sync History
            </ButtonLink>
          </div>
        </div>
      </div>
    </div>
  );
}
