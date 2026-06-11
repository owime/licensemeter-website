"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { apiAccess } from "~/server/access";
import { db } from "~/server/db";
import { findings, memberships, priceBook, tenants } from "~/server/db/schema";
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
  revalidateApp();
  return ok();
};

/** Manual sync trigger from the settings page. */
export const triggerSync = async (): Promise<ActionResult> => {
  const ctx = await apiAccess("admin");
  if (!ctx) return fail("Not allowed");
  const result = await runSync(ctx.tenant.id);
  revalidateApp();
  return result.status === "failed" ? fail("Sync failed; see sync history") : ok();
};

/** Deletes the workspace and all synced data (cascade). Owner only. */
export const disconnectTenant = async (): Promise<ActionResult> => {
  const ctx = await apiAccess("owner");
  if (!ctx) return fail("Not allowed");
  await db.delete(tenants).where(eq(tenants.id, ctx.tenant.id));
  revalidatePath("/", "layout");
  redirect("/");
};
