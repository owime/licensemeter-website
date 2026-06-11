import { and, eq, inArray, or, sql } from "drizzle-orm";
import { redirect } from "next/navigation";

import { auth, type Session } from "~/server/auth";
import { db } from "~/server/db";
import { memberships, tenants } from "~/server/db/schema";
import { ensureDemoWorkspace } from "~/server/demo/seed";
import type { MembershipRole } from "~/server/types";

export type AccessContext = {
  user: { oid: string; tid: string; upn: string; name: string; isDemo: boolean };
  tenant: typeof tenants.$inferSelect;
  membership: typeof memberships.$inferSelect;
};

const ROLE_RANK: Record<MembershipRole, number> = {
  viewer: 0,
  admin: 1,
  owner: 2,
};

export const hasRole = (ctx: AccessContext, minRole: MembershipRole) =>
  ROLE_RANK[ctx.membership.role] >= ROLE_RANK[minRole];

/**
 * Resolves the signed-in user's workspace. The workspace is the tenant the
 * user signs in from (1:1 by tid). Membership is invite-based: matched by
 * Entra object id, or by email/UPN for invited users signing in for the first
 * time (their oid is claimed on first match). Same-tenant sign-in alone does
 * NOT grant access.
 */
const resolveAccess = async (
  session: Session | null,
): Promise<AccessContext | null> => {
  if (!session?.user?.oid) return null;
  const { oid, tid, upn, isDemo } = session.user;

  if (isDemo) await ensureDemoWorkspace();

  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.tid, tid),
  });
  if (!tenant) return null;

  const identifiers = [upn, session.user.email ?? ""]
    .filter(Boolean)
    .map((s) => s.toLowerCase());

  const membership = await db.query.memberships.findFirst({
    where: and(
      eq(memberships.tenantId, tenant.id),
      or(
        eq(memberships.oid, oid),
        identifiers.length > 0
          ? inArray(sql`lower(${memberships.email})`, identifiers)
          : sql`false`,
      ),
    ),
  });
  if (!membership) return null;

  // First sign-in of an invited user: claim the membership row.
  if (!membership.oid) {
    await db
      .update(memberships)
      .set({ oid, name: session.user.name ?? null })
      .where(eq(memberships.id, membership.id));
    membership.oid = oid;
  }

  return {
    user: { oid, tid, upn, name: session.user.name ?? "", isDemo },
    tenant,
    membership,
  };
};

/** For pages/layouts: redirects to landing when signed out. */
export const requireSession = async (): Promise<Session> => {
  const session = await auth();
  if (!session?.user?.oid) redirect("/");
  return session;
};

/** For pages/layouts: null when the tenant is not connected or user not invited. */
export const getAccessContext = async (): Promise<AccessContext | null> => {
  const session = await requireSession();
  return resolveAccess(session);
};

/** For pages/layouts: redirects to the connect page / overview as appropriate. */
export const requireAccess = async (
  minRole: MembershipRole = "viewer",
): Promise<AccessContext> => {
  const ctx = await getAccessContext();
  if (!ctx) redirect("/app/connect");
  if (!hasRole(ctx, minRole)) redirect("/app");
  return ctx;
};

/** For API routes and server actions: returns null instead of redirecting. */
export const apiAccess = async (
  minRole: MembershipRole = "viewer",
): Promise<AccessContext | null> => {
  const session = await auth();
  const ctx = await resolveAccess(session);
  if (!ctx || !hasRole(ctx, minRole)) return null;
  return ctx;
};
