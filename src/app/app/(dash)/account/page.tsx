import { withAuth } from "@workos-inc/authkit-nextjs";

import { signOutAction } from "~/app/auth/actions";
import { AccountSessionSync } from "~/components/workspace/AccountSessionSync";
import { AccountWidgets } from "~/components/workspace/AccountWidgets";
import { Button, ButtonLink } from "~/components/ui";
import { authProvider } from "~/env";
import { requireAccess } from "~/server/access";

export const metadata = { title: "Account" };

/**
 * Self-service account page: the signed-in user manages their own name, password
 * and MFA via the WorkOS widgets. WorkOS-only — under the entra opt-out there is
 * no WorkOS profile to manage (those users manage it in Entra / Microsoft).
 */
export default async function AccountPage() {
  // Same gate as the rest of /app (also keeps the sidebar/layout consistent).
  await requireAccess("viewer");

  if (authProvider() !== "workos") {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6 pb-8">
        <header className="rise rise-1">
          <h1 className="font-display text-3xl tracking-tight">Account</h1>
          <p className="text-ink-soft mt-1 text-sm">
            Your profile, password and sign-in security are managed by Microsoft
            Entra ID. Update them in your Microsoft account — changes apply across
            every workspace you belong to.
          </p>
        </header>
      </div>
    );
  }

  const { user, accessToken } = await withAuth();
  if (!user || !accessToken) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6 pb-8">
        <header className="rise rise-1">
          <h1 className="font-display text-3xl tracking-tight">Account</h1>
          <p className="text-ink-soft mt-1 text-sm">
            We couldn&rsquo;t load your account details. Signing out and back in
            usually fixes this.
          </p>
        </header>
        <div className="rise rise-2 flex flex-wrap items-center gap-3">
          <form action={signOutAction}>
            <Button variant="primary">Sign out</Button>
          </form>
          <ButtonLink href="/">Back to home</ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 pb-8">
      <header className="rise rise-1">
        <h1 className="font-display text-3xl tracking-tight">Account</h1>
        <p className="text-ink-soft mt-1 text-sm">
          Manage your name, password and sign-in security. These apply to your
          personal login across every workspace you belong to.
        </p>
      </header>
      <div className="rise rise-2">
        <AccountWidgets accessToken={accessToken} />
      </div>
      {/* Re-seal the session after widget edits so the sidebar name stays current. */}
      <AccountSessionSync />
    </div>
  );
}
