"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  apiAccess,
  WORKSPACE_COOKIE,
  workspaceCookieOptions,
} from "~/server/access";
import { audit } from "~/server/audit";
import { db } from "~/server/db";
import {
  adobeConnections,
  adobeUsers,
  emailSignups,
  findings,
  memberships,
  priceBook,
  saasConnections,
  saasSeats,
  tenants,
} from "~/server/db/schema";
import { UmapiClient } from "~/server/adobe/client";
import { buildSaasClient, isSaasProvider } from "~/server/saas/registry";
import { normalizeSalesforceOrgRef } from "~/server/saas/salesforce";
import { connectorSpec } from "~/lib/connectors";
import { encryptSecret } from "~/server/crypto";
import { emailEnabled, inviteHtml, sendEmail } from "~/server/email";
import { notifyOps } from "~/server/ops";
import { clientIp, rateLimit } from "~/server/rateLimit";
import { siteUrl } from "~/env";
import { runAnalysis, runSync } from "~/server/sync/runSync";
import type { MembershipRole } from "~/server/types";

export type ActionResult = { ok: boolean; error?: string };

const fail = (error: string): ActionResult => ({ ok: false, error });
const ok = (): ActionResult => ({ ok: true });

const revalidateApp = () => revalidatePath("/app", "layout");

/** Acknowledge / reopen a finding. */
export const setFindingStatus = async (
  findingId: string,
  status: "open" | "acknowledged",
): Promise<ActionResult> => {
  const ctx = await apiAccess("admin");
  if (!ctx) return fail("Not allowed");

  const updated = await db
    .update(findings)
    .set({ status })
    .where(and(eq(findings.id, findingId), eq(findings.tenantId, ctx.tenant.id)))
    .returning({ id: findings.id });
  if (updated.length === 0) return fail("Finding not found");
  await audit(ctx, "finding_status_changed", { findingId, status });
  revalidateApp();
  return ok();
};

/** Bulk acknowledge/reopen from the findings table checkboxes. */
export const bulkSetFindingStatus = async (
  formData: FormData,
): Promise<ActionResult> => {
  const ctx = await apiAccess("admin");
  if (!ctx) return fail("Not allowed");

  const status = formData.get("status") === "open" ? "open" : "acknowledged";
  const ids = formData
    .getAll("id")
    .filter((v): v is string => typeof v === "string")
    .slice(0, 500);
  if (ids.length === 0) return fail("Nothing selected");

  const updated = await db
    .update(findings)
    .set({ status })
    .where(and(inArray(findings.id, ids), eq(findings.tenantId, ctx.tenant.id)))
    .returning({ id: findings.id });
  await audit(ctx, "findings_bulk_updated", { count: updated.length, status });
  revalidateApp();
  return ok();
};

/** Update a price book entry (euros/dollars as decimal string) and re-run analysis. */
export const updatePrice = async (
  skuId: string,
  price: string,
): Promise<ActionResult> => {
  const ctx = await apiAccess("admin");
  if (!ctx) return fail("Not allowed");

  const parsed = Number.parseFloat(price.replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100_000) {
    return fail("Invalid price");
  }
  const cents = Math.round(parsed * 100);

  const updated = await db
    .update(priceBook)
    .set({ monthlyPriceCents: cents, source: "custom", updatedAt: new Date() })
    .where(and(eq(priceBook.tenantId, ctx.tenant.id), eq(priceBook.skuId, skuId)))
    .returning({ skuId: priceBook.skuId });
  if (updated.length === 0) return fail("Unknown SKU");

  await audit(ctx, "price_updated", { skuId, monthlyPriceCents: cents });
  await runAnalysis(ctx.tenant.id);
  revalidateApp();
  return ok();
};

/** Invite a member by email/UPN; they get access on their first sign-in. */
export const addMember = async (formData: FormData): Promise<ActionResult> => {
  const ctx = await apiAccess("admin");
  if (!ctx) return fail("Not allowed");

  const emailRaw = formData.get("email");
  const roleRaw = formData.get("role");
  const email =
    typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";
  const role = (
    typeof roleRaw === "string" ? roleRaw : "viewer"
  ) as MembershipRole;

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail("Invalid email");
  if (!["viewer", "admin", "owner"].includes(role)) return fail("Invalid role");
  if (role === "owner" && ctx.membership.role !== "owner") {
    return fail("Only owners can add owners");
  }

  await db
    .insert(memberships)
    .values({ tenantId: ctx.tenant.id, email, role })
    .onConflictDoUpdate({
      target: [memberships.tenantId, memberships.email],
      set: { role },
    });
  await audit(ctx, "member_added", { email, role });

  // Invite email — never from the public demo workspace (open-relay risk),
  // and never a reason for the invite itself to fail.
  if (!ctx.tenant.isDemo && emailEnabled()) {
    try {
      await sendEmail({
        to: [email],
        subject: `${ctx.user.name || ctx.membership.email} invited you to LicenseMeter (${ctx.tenant.name ?? "workspace"})`,
        html: inviteHtml({
          inviterName: ctx.user.name || ctx.membership.email,
          tenantName: ctx.tenant.name ?? ctx.tenant.tid,
          role,
          appUrl: siteUrl(),
        }),
      });
    } catch (err) {
      console.error("[invite] email failed", err);
    }
  }

  revalidateApp();
  return ok();
};

/** Resend a pending invite: resets the 14-day expiry and re-sends the email. */
export const resendInvite = async (
  membershipId: string,
): Promise<ActionResult> => {
  const ctx = await apiAccess("admin");
  if (!ctx) return fail("Not allowed");

  const target = await db.query.memberships.findFirst({
    where: and(
      eq(memberships.id, membershipId),
      eq(memberships.tenantId, ctx.tenant.id),
    ),
  });
  if (!target) return fail("Invite not found");
  if (target.oid) return fail("This member has already signed in");
  if (!rateLimit(`resend:${ctx.tenant.id}`, 10, 60 * 60 * 1000)) {
    return fail("Too many resends this hour");
  }

  await db
    .update(memberships)
    .set({ createdAt: new Date() })
    .where(eq(memberships.id, target.id));
  await audit(ctx, "invite_resent", { email: target.email });

  if (!ctx.tenant.isDemo && emailEnabled()) {
    try {
      await sendEmail({
        to: [target.email],
        subject: `${ctx.user.name || ctx.membership.email} invited you to LicenseMeter (${ctx.tenant.name ?? "workspace"})`,
        html: inviteHtml({
          inviterName: ctx.user.name || ctx.membership.email,
          tenantName: ctx.tenant.name ?? ctx.tenant.tid,
          role: target.role,
          appUrl: siteUrl(),
        }),
      });
    } catch (err) {
      console.error("[invite] resend email failed", err);
    }
  }
  revalidateApp();
  return ok();
};

export const removeMember = async (
  membershipId: string,
): Promise<ActionResult> => {
  const ctx = await apiAccess("admin");
  if (!ctx) return fail("Not allowed");

  const target = await db.query.memberships.findFirst({
    where: and(
      eq(memberships.id, membershipId),
      eq(memberships.tenantId, ctx.tenant.id),
    ),
  });
  if (!target) return fail("Member not found");
  if (target.role === "owner" && ctx.membership.role !== "owner") {
    return fail("Only owners can remove owners");
  }
  if (target.id === ctx.membership.id) return fail("You cannot remove yourself");

  await db.delete(memberships).where(eq(memberships.id, target.id));
  await audit(ctx, "member_removed", { email: target.email, role: target.role });
  revalidateApp();
  return ok();
};

/** Per-workspace inactivity threshold (days) for the inactive-users rule. */
export const setInactiveDays = async (
  formData: FormData,
): Promise<ActionResult> => {
  const ctx = await apiAccess("admin");
  if (!ctx) return fail("Not allowed");
  const raw = formData.get("days");
  const days = typeof raw === "string" ? Number.parseInt(raw, 10) : NaN;
  if (!Number.isInteger(days) || days < 7 || days > 365) {
    return fail("Threshold must be between 7 and 365 days");
  }
  await db
    .update(tenants)
    .set({ inactiveDays: days })
    .where(eq(tenants.id, ctx.tenant.id));
  await audit(ctx, "threshold_changed", { inactiveDays: days });
  await runAnalysis(ctx.tenant.id);
  revalidateApp();
  return ok();
};

export const setCurrency = async (currency: string): Promise<ActionResult> => {
  const ctx = await apiAccess("admin");
  if (!ctx) return fail("Not allowed");
  if (!["EUR", "USD", "GBP", "CHF"].includes(currency)) {
    return fail("Unsupported currency");
  }
  await db
    .update(tenants)
    .set({ currency })
    .where(eq(tenants.id, ctx.tenant.id));
  await audit(ctx, "currency_changed", { currency });
  revalidateApp();
  return ok();
};

/** Manual sync trigger from the settings page. */
export const triggerSync = async (): Promise<ActionResult> => {
  const ctx = await apiAccess("admin");
  if (!ctx) return fail("Not allowed");
  await audit(ctx, "sync_triggered", {});
  const result = await runSync(ctx.tenant.id);
  revalidateApp();
  return result.status === "failed" ? fail("Sync failed; see sync history") : ok();
};

/** Connect the Adobe Admin Console (UMAPI server-to-server credentials). */
export const connectAdobe = async (
  formData: FormData,
): Promise<ActionResult> => {
  const ctx = await apiAccess("admin");
  if (!ctx) return fail("Not allowed");
  if (ctx.tenant.isDemo) return fail("The demo workspace ships with demo Adobe data");

  const read = (name: string) => {
    const v = formData.get(name);
    return typeof v === "string" ? v.trim() : "";
  };
  const orgId = read("orgId");
  const clientId = read("clientId");
  const clientSecret = read("clientSecret");
  if (!orgId || !clientId || !clientSecret) return fail("All three fields are required");
  if ([orgId, clientId, clientSecret].some((v) => v.length > 200)) {
    return fail("Credential value too long");
  }

  // Validate against Adobe before storing anything.
  try {
    await new UmapiClient({ orgId, clientId, clientSecret }).getUsers();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return fail(`Adobe rejected the credentials: ${message.slice(0, 120)}`);
  }

  await db
    .insert(adobeConnections)
    .values({
      tenantId: ctx.tenant.id,
      orgId,
      clientId,
      clientSecretEnc: encryptSecret(clientSecret),
    })
    .onConflictDoUpdate({
      target: adobeConnections.tenantId,
      set: {
        orgId,
        clientId,
        clientSecretEnc: encryptSecret(clientSecret),
        lastSyncStatus: null,
        lastSyncAt: null,
      },
    });
  await audit(ctx, "adobe_connected", { orgId });
  await runSync(ctx.tenant.id);
  revalidateApp();
  return ok();
};

/** Remove the Adobe connection and its data; findings auto-resolve. */
export const disconnectAdobe = async (): Promise<ActionResult> => {
  const ctx = await apiAccess("admin");
  if (!ctx) return fail("Not allowed");
  if (ctx.tenant.isDemo) return fail("The demo workspace ships with demo Adobe data");

  await db
    .delete(adobeConnections)
    .where(eq(adobeConnections.tenantId, ctx.tenant.id));
  await db.delete(adobeUsers).where(eq(adobeUsers.tenantId, ctx.tenant.id));
  await audit(ctx, "adobe_disconnected", {});
  await runAnalysis(ctx.tenant.id);
  revalidateApp();
  return ok();
};

/** Connect a SaaS connector (Zoom / Atlassian / Salesforce). */
export const connectSaasConnector = async (
  formData: FormData,
): Promise<ActionResult> => {
  const ctx = await apiAccess("admin");
  if (!ctx) return fail("Not allowed");
  if (ctx.tenant.isDemo)
    return fail("The demo workspace ships with demo connector data");

  const read = (name: string) => {
    const v = formData.get(name);
    return typeof v === "string" ? v.trim() : "";
  };
  const providerRaw = read("provider");
  if (!isSaasProvider(providerRaw)) return fail("Unknown connector");
  const provider = providerRaw;
  const spec = connectorSpec(provider);

  const values: Record<string, string> = {};
  for (const field of spec.fields) {
    const v = read(field.name);
    if (!v) return fail(`${field.label} is required`);
    if (v.length > 1000) return fail(`${field.label} is too long`);
    values[field.name] = v;
  }
  let orgRef = values.orgRef!;
  if (provider === "salesforce") {
    const origin = normalizeSalesforceOrgRef(orgRef);
    if (!origin)
      return fail(
        "The instance URL must be your https://<domain>.my.salesforce.com My Domain",
      );
    orgRef = origin;
  }
  const clientId = values.clientId ?? null;
  const secret = values.secret!;

  // Validate against the provider before storing anything. Full error goes
  // to the server log only — provider error bodies can echo submitted
  // credentials, so the browser gets a generic message.
  try {
    const client = await buildSaasClient(provider, {
      orgRef,
      clientId,
      secret,
    });
    await client.getSeats();
  } catch (err) {
    console.error(`[saas connect] ${provider}:`, err);
    return fail(
      `${spec.label} rejected the credentials — check the values and try again`,
    );
  }

  await db
    .insert(saasConnections)
    .values({
      tenantId: ctx.tenant.id,
      provider,
      orgRef,
      clientId,
      secretEnc: encryptSecret(secret),
    })
    .onConflictDoUpdate({
      target: [saasConnections.tenantId, saasConnections.provider],
      set: {
        orgRef,
        clientId,
        secretEnc: encryptSecret(secret),
        lastSyncStatus: null,
        lastSyncAt: null,
      },
    });
  await audit(ctx, "connector_connected", { provider, orgRef });
  await runSync(ctx.tenant.id);
  revalidateApp();
  return ok();
};

/** Remove a SaaS connection and its seats; findings auto-resolve. */
export const disconnectSaasConnector = async (
  providerRaw: string,
): Promise<ActionResult> => {
  const ctx = await apiAccess("admin");
  if (!ctx) return fail("Not allowed");
  if (ctx.tenant.isDemo)
    return fail("The demo workspace ships with demo connector data");
  if (!isSaasProvider(providerRaw)) return fail("Unknown connector");
  const provider = providerRaw;

  await db
    .delete(saasConnections)
    .where(
      and(
        eq(saasConnections.tenantId, ctx.tenant.id),
        eq(saasConnections.provider, provider),
      ),
    );
  await db
    .delete(saasSeats)
    .where(
      and(
        eq(saasSeats.tenantId, ctx.tenant.id),
        eq(saasSeats.provider, provider),
      ),
    );
  await audit(ctx, "connector_disconnected", { provider });
  await runAnalysis(ctx.tenant.id);
  revalidateApp();
  return ok();
};

/** Switch the active workspace (MSP/multi-tenant users). */
export const switchWorkspace = async (
  tenantId: string,
): Promise<ActionResult> => {
  const ctx = await apiAccess("viewer");
  if (!ctx) return fail("Not allowed");
  const target = ctx.workspaces.find((w) => w.id === tenantId);
  if (!target) return fail("Unknown workspace");
  (await cookies()).set(WORKSPACE_COOKIE, tenantId, workspaceCookieOptions());
  await audit(ctx, "workspace_switched", { to: target.name });
  revalidateApp();
  return ok();
};

/**
 * Public email capture from the landing page (no auth — visitors).
 * Honeypot field + format check + unique constraint keep junk out.
 */
export const captureEmail = async (
  formData: FormData,
): Promise<ActionResult> => {
  if (formData.get("website")) return ok(); // honeypot: pretend success to bots
  const ip = clientIp(await headers());
  if (!rateLimit(`capture:${ip}`, 5, 60 * 60 * 1000)) {
    return fail("Too many attempts — please try again later");
  }
  const raw = formData.get("email");
  const email = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (email.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return fail("Please enter a valid email address");
  }
  const inserted = await db
    .insert(emailSignups)
    .values({ email, source: "landing" })
    .onConflictDoNothing()
    .returning({ id: emailSignups.id });
  if (inserted.length > 0) {
    void notifyOps(`new email signup from the landing page: ${email}`);
  }
  return ok();
};

/** Deletes the workspace and all synced data (cascade). Owner only. */
export const disconnectTenant = async (): Promise<ActionResult> => {
  const ctx = await apiAccess("owner");
  if (!ctx) return fail("Not allowed");
  if (ctx.tenant.isDemo) return fail("The demo workspace cannot be disconnected");
  await db.delete(tenants).where(eq(tenants.id, ctx.tenant.id));
  revalidatePath("/", "layout");
  redirect("/");
};
