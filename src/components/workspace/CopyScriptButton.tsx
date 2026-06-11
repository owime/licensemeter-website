"use client";

import { useState } from "react";

/** Fetches the generated remediation script and copies it to the clipboard. */
export const CopyScriptButton = ({ url }: { url: string }) => {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");

  return (
    <button
      onClick={async () => {
        try {
          const res = await fetch(url);
          if (!res.ok) throw new Error();
          await navigator.clipboard.writeText(await res.text());
          setState("copied");
        } catch {
          setState("error");
        }
        setTimeout(() => setState("idle"), 2000);
      }}
      className="border border-line-strong bg-card px-3.5 py-2 text-xs font-medium tracking-wide uppercase transition hover:border-ink"
    >
      {state === "copied"
        ? "Copied"
        : state === "error"
          ? "Copy failed"
          : "Copy PowerShell"}
    </button>
  );
};
