"use client";

import { MessageCircle } from "lucide-react";
import { buttonClass } from "~/components/ui";
import type {} from "~/components/CrispChat";

export function SupportChatButton() {
  return (
    <button
      type="button"
      className={buttonClass("ink")}
      onClick={() => {
        window.$crisp ??= [] as unknown[][];
        window.$crisp.push(["do", "chat:show"]);
        window.$crisp.push(["do", "chat:open"]);
      }}
    >
      <MessageCircle className="size-4" aria-hidden="true" />
      Open support chat
    </button>
  );
}
