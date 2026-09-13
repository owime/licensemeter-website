"use client";

import Script from "next/script";

export const CRISP_WEBSITE_ID = "d8cf4fcb-0dbe-42ee-b94c-3bbc415d58f4";

declare global {
  interface Window {
    $crisp?: { push: (command: unknown[]) => void };
    CRISP_WEBSITE_ID?: string;
  }
}

/** Mounted once in the root layout, so chat survives client-side navigation. */
export function CrispChat() {
  return (
    <Script id="crisp-chat" strategy="afterInteractive">{`
      window.$crisp = window.$crisp || [];
      window.CRISP_WEBSITE_ID = "${CRISP_WEBSITE_ID}";
      window.$crisp.push(["config", "color:mode", ["light"]]);
      window.$crisp.push(["config", "color:theme", ["teal"]]);
      if (!document.getElementById("crisp-sdk")) {
        var script = document.createElement("script");
        script.id = "crisp-sdk";
        script.src = "https://client.crisp.chat/l.js";
        script.async = true;
        document.head.appendChild(script);
      }
    `}</Script>
  );
}
