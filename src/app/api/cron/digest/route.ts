import { and, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";

import { env, siteUrl } from "~/env";
import { fmtMoney } from "~/lib/format";
import { db } from "~/server/db";
import { findings, memberships, snapshots, tenants } from "~/server/db/schema";
import { digestHtml, emailEnabled, sendEmail } from "~/server/email";
import { notifyOps } from "~/server/ops";

export const maxDuration = 300;

/** Weekly digest to workspace owners/admins. No-op until Resend is configured. */
export const GET = async (req: NextRequest) => {
  if (
    !env.CRON_SECRET ||
    req.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!emailEnabled()) {
    return NextResponse.json({ skipped: "email not configured" });
  }

  const allTenants = await db.query.tenants.findMany({
    where: eq(tenants.isDemo, false),
  });
  let sent = 0;

  for (const tenant of allTenants) {
    try {
      const [admins, open, latest] = await Promise.all([
        db.query.memberships.findMany({
          where: and(
            eq(memberships.tenantId, tenant.id),
            inArray(memberships.role, ["owner", "admin"]),
            isNotNull(memberships.oid),
          ),
        }),
        db.query.findings.findMany({
          where: and(
            eq(findings.tenantId, tenant.id),
            inArray(findings.status, ["open", "acknowledged"]),
          ),
          orderBy: desc(findings.monthlyImpactCents),
        }),
        db.query.snapshots.findFirst({
          where: eq(snapshots.tenantId, tenant.id),
          orderBy: desc(snapshots.day),
        }),
      ]);

      const to = admins.map((m) => m.email).filter(Boolean);
      if (to.length === 0 || open.length === 0) continue;

      const wasteCents = latest?.totalMonthlyWasteCents ?? 0;
      const tenantLabel = tenant.name ?? "your tenant";
      await sendEmail({
        to,
        // With unpriced SKUs the waste is 0 — lead with the findings count
        // instead of an underwhelming zero.
        subject:
          wasteCents > 0
            ? `LicenseMeter: ${fmtMoney(wasteCents, tenant.currency)}/mo wasted in ${tenantLabel}`
            : `LicenseMeter: ${open.length} open findings in ${tenantLabel}`,
        html: digestHtml({
          tenantName: tenant.name ?? tenant.tid,
          currency: tenant.currency,
          monthlySpend: fmtMoney(latest?.totalMonthlySpendCents ?? 0, tenant.currency),
          monthlyWaste: fmtMoney(latest?.totalMonthlyWasteCents ?? 0, tenant.currency),
          openFindings: open.length,
          topFindings: open.slice(0, 5).map((f) => ({
            title: f.title,
            impact: fmtMoney(f.monthlyImpactCents, tenant.currency),
          })),
          appUrl: siteUrl(),
        }),
      });
      sent++;
    } catch (err) {
      void notifyOps(
        `digest failed for tenant ${tenant.name ?? tenant.tid}: ${err instanceof Error ? err.message : String(err)}`,
        { key: `digest:${tenant.id}`, cooldownMs: 60 * 60 * 1000 },
      );
    }
  }

  return NextResponse.json({ tenants: allTenants.length, sent });
};
