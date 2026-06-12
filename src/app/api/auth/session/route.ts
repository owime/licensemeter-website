import { auth } from "~/server/auth";

/*
 * Minimal session probe for the static marketing shell. The header CTA swap
 * is the only thing on the marketing pages that needs auth state, and reading
 * the session cookie in the layout would force every marketing route into
 * dynamic rendering. Boolean only — no user data crosses this endpoint.
 */
export async function GET(): Promise<Response> {
  const session = await auth();
  return Response.json(
    { signedIn: Boolean(session?.user) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
