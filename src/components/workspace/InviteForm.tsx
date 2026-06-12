"use client";

import { useActionState } from "react";

import { Button } from "~/components/ui";
import { addMember } from "~/server/actions";
import type { ActionResult } from "~/server/actions";

type InviteState = (ActionResult & { email?: string }) | null;

/**
 * Invite form for the Members card. Wraps the addMember server action in
 * useActionState so success and failure surface in a live region instead of
 * being discarded; on failure the typed email survives the form reset.
 */
export const InviteForm = ({
  allowOwner,
  inviteEmailsActive,
}: {
  allowOwner: boolean;
  inviteEmailsActive: boolean;
}) => {
  const [result, formAction, pending] = useActionState(
    async (_prev: InviteState, formData: FormData): Promise<InviteState> => {
      const email = formData.get("email");
      const res = await addMember(formData);
      return { ...res, email: typeof email === "string" ? email : undefined };
    },
    null,
  );

  return (
    <form
      action={formAction}
      className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4"
    >
      <input
        // Remount on each new failure so defaultValue re-applies; resets after success.
        key={result && !result.ok ? (result.email ?? "") : "clean"}
        name="email"
        type="email"
        required
        aria-label="Email address to invite"
        placeholder="colleague@yourcompany.com"
        defaultValue={result && !result.ok ? result.email : undefined}
        className="min-w-56 flex-1 border border-line bg-card px-3 py-2 text-sm focus:border-ink"
      />
      <select
        name="role"
        defaultValue="viewer"
        aria-label="Role for the invited member"
        className="border border-line bg-card px-2 py-2 text-sm focus:border-ink"
      >
        <option value="viewer">Viewer (finance)</option>
        <option value="admin">Admin</option>
        {allowOwner && <option value="owner">Owner</option>}
      </select>
      <Button variant="primary" disabled={pending} className="px-4 py-2">
        {pending ? "Inviting…" : "Invite"}
      </Button>
      <p
        role="status"
        aria-live="polite"
        className={
          result
            ? `w-full text-xs ${result.ok ? "text-moss" : "text-rust-text"}`
            : "sr-only"
        }
      >
        {result === null
          ? null
          : result.ok
            ? `Invited ${result.email ?? "member"}.`
            : (result.error ?? "Invite failed")}
      </p>
      <p className="w-full text-xs text-ink-faint">
        {inviteEmailsActive
          ? "Invited people get an email with a sign-in link and gain access on their first Microsoft sign-in."
          : "Invited people get access when they first sign in with Microsoft using this email."}{" "}
        Same-tenant sign-in alone never grants access.
      </p>
    </form>
  );
};
