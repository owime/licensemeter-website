import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { apiAccess } from "~/server/access";
import { centsToDecimal, csvResponse, toCsv } from "~/server/csv";
import { db } from "~/server/db";
import { findings } from "~/server/db/schema";

export const GET = async () => {
  const ctx = await apiAccess("viewer");
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const rows = await db.query.findings.findMany({
    where: eq(findings.tenantId, ctx.tenant.id),
    orderBy: desc(findings.monthlyImpactCents),
  });

  const csv = toCsv([
    [
      "Rule",
      "Title",
      "User",
      "SKU",
      `Monthly impact (${ctx.tenant.currency})`,
      "Status",
      "First seen",
      "Last seen",
    ],
    ...rows.map((f) => {
      const detail = f.detail as { upn?: string };
      return [
        f.rule,
        f.title,
        detail.upn ?? "",
        f.skuId ?? "",
        centsToDecimal(f.monthlyImpactCents),
        f.status,
        f.firstSeenAt.toISOString().slice(0, 10),
        f.lastSeenAt.toISOString().slice(0, 10),
      ];
    }),
  ]);
  return csvResponse("licensemeter-findings.csv", csv);
};
