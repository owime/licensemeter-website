"use client";

import { useEffect, useState } from "react";

import type { SyncStep } from "~/server/types";

type RunInfo = {
  status: "running" | "success" | "partial" | "failed";
  steps: SyncStep[];
  error: string | null;
} | null;

/** Polls sync status after admin consent until the first sync lands. */
export const ConnectPoller = () => {
  const [run, setRun] = useState<RunInfo>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch("/api/sync", { cache: "no-store" });
        if (!res.ok) return;
        const body = (await res.json()) as { run: RunInfo };
        if (cancelled) return;
        setRun(body.run);
        if (body.run?.status === "success" || body.run?.status === "partial") {
          window.location.href = "/app";
        }
      } catch {
        // transient network error; keep polling
      }
    };
    void poll();
    const id = setInterval(() => setTick((t) => t + 1), 2500);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (tick === 0) return;
    void fetch("/api/sync", { cache: "no-store" })
      .then(async (res) => (res.ok ? ((await res.json()) as { run: RunInfo }) : null))
      .then((body) => {
        if (!body) return;
        setRun(body.run);
        if (body.run?.status === "success" || body.run?.status === "partial") {
          window.location.href = "/app";
        }
      })
      .catch(() => undefined);
  }, [tick]);

  if (run?.status === "failed") {
    return (
      <div className="border border-rust-soft bg-rust-soft/50 p-4 text-sm text-rust-deep">
        <p className="font-medium">The first sync failed.</p>
        <p className="mt-1">{run.error ?? "Check the sync history in settings."}</p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm text-ink-soft">
      <span className="inline-block size-2 animate-pulse rounded-full bg-rust" />
      Running the first sync — pulling licenses, users and usage reports…
    </div>
  );
};
