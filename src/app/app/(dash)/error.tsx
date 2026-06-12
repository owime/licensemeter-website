"use client";

import { Button } from "~/components/ui";

/** Dash-level error boundary. No internals on screen — just a way back. */
export default function DashError({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-3xl tracking-tight">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-md text-sm text-ink-soft">
        This page failed to load. Your data is unaffected — try again, and if
        it keeps happening, sign out and back in.
      </p>
      <div className="mt-5">
        <Button onClick={() => reset()}>Try again</Button>
      </div>
    </div>
  );
}
