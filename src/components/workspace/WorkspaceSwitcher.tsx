"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { switchWorkspace } from "~/server/actions";
import type { WorkspaceSummary } from "~/server/access";

/** Shown instead of the static tenant name when the user can open several workspaces. */
export const WorkspaceSwitcher = ({
  workspaces,
  activeId,
}: {
  workspaces: WorkspaceSummary[];
  activeId: string;
}) => {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <select
      value={activeId}
      disabled={pending}
      aria-label="Active workspace"
      onChange={(e) =>
        startTransition(async () => {
          await switchWorkspace(e.target.value);
          router.refresh();
        })
      }
      className="w-full rounded-none border border-sidebar-line bg-sidebar px-2 py-1 text-sm font-medium text-paper focus:border-sidebar-soft"
    >
      {workspaces.map((w) => (
        <option key={w.id} value={w.id}>
          {w.name}
          {w.isDemo ? " (demo)" : ""}
        </option>
      ))}
    </select>
  );
};
