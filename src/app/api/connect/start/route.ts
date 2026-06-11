import { redirect } from "next/navigation";

import { appBaseUrl, env } from "~/env";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { consentStates } from "~/server/db/schema";

/**
 * Kicks off the one-time admin-consent flow for the connector app.
 * A state nonce binds the eventual callback to the initiating user.
 */
export const GET = async () => {
  const session = await auth();
  if (!session?.user?.oid) redirect("/");
  if (session.user.isDemo) redirect("/app");
  if (!env.CONNECTOR_CLIENT_ID) redirect("/app/connect?error=not_configured");

  const state = crypto.randomUUID();
  await db.insert(consentStates).values({
    state,
    oid: session.user.oid,
    tid: session.user.tid,
    email:
      session.user.upn !== "" ? session.user.upn : (session.user.email ?? ""),
    name: session.user.name ?? null,
  });

  const url = new URL(
    "https://login.microsoftonline.com/organizations/v2.0/adminconsent",
  );
  url.searchParams.set("client_id", env.CONNECTOR_CLIENT_ID);
  url.searchParams.set("scope", "https://graph.microsoft.com/.default");
  url.searchParams.set("redirect_uri", `${appBaseUrl()}/api/connect/callback`);
  url.searchParams.set("state", state);

  redirect(url.toString());
};
