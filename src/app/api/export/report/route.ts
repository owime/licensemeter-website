import { renderToBuffer } from "@react-pdf/renderer";
import { and, desc, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

import { fmtDate, fmtMoney } from "~/lib/format";
import { RULE_META } from "~/lib/rules";
import { apiAccess } from "~/server/access";
import { audit } from "~/server/audit";
import { db } from "~/server/db";
import { findings, priceBook, tenantSkus } from "~/server/db/schema";
import { WasteReport } from "~/server/report/WasteReport";
import type { WasteRuleId } from "~/server/types";

export const maxDuration = 60;

/** Branded PDF waste report — the artifact finance forwards upward. */
export const GET = async () => {
  const ctx = await apiAccess("viewer");
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const tenantId = ctx.tenant.id;
  const currency = ctx.tenant.currency;

  const [skus, prices, open] = await Promise.all([
    db.query.tenantSkus.findMany({ where: eq(tenantSkus.tenantId, tenantId) }),
    db.query.priceBook.findMany({ where: eq(priceBook.tenantId, tenantId) }),
    db.query.findings.findMany({
      where: and(
        eq(findings.tenantId, tenantId),
        inArray(findings.status, ["open", "acknowledged"]),
      ),
      orderBy: desc(findings.monthlyImpactCents),
    }),
  ]);

  const priceBySku = new Map(prices.map((p) => [p.skuId, p.monthlyPriceCents]));
  const monthlySpend = skus.reduce(
    (sum, s) => sum + s.consumedUnits * (priceBySku.get(s.skuId) ?? 0),
    0,
  );
  const monthlyWaste = open.reduce((sum, f) => sum + f.monthlyImpactCents, 0);

  const byRule = new Map<WasteRuleId, { count: number; impact: number }>();
  for (const f of open) {
    const agg = byRule.get(f.rule) ?? { count: 0, impact: 0 };
    agg.count += 1;
    agg.impact += f.monthlyImpactCents;
    byRule.set(f.rule, agg);
  }

  const pdf = await renderToBuffer(
    WasteReport({
      data: {
        tenantName: ctx.tenant.name ?? ctx.tenant.tid,
        generatedOn: fmtDate(new Date()),
        monthlySpend: fmtMoney(monthlySpend, currency),
        monthlyWaste: `${fmtMoney(monthlyWaste, currency)}/mo`,
        annualWaste: fmtMoney(monthlyWaste * 12, currency),
        openFindings: open.length,
        byRule: [...byRule.entries()]
          .sort((a, b) => b[1].impact - a[1].impact)
          .map(([rule, agg]) => ({
            label: RULE_META[rule].label,
            count: agg.count,
            impact:
              agg.impact > 0 ? `${fmtMoney(agg.impact, currency)}/mo` : "—",
          })),
        topFindings: open.slice(0, 12).map((f) => ({
          title: f.title,
          impact:
            f.monthlyImpactCents > 0
              ? `${fmtMoney(f.monthlyImpactCents, currency)}/mo`
              : "—",
        })),
      },
    }),
  );

  await audit(ctx, "export_report", { findings: open.length });
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="licensemeter-waste-report.pdf"',
    },
  });
};
