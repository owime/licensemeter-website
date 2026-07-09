/**
 * Promote the legacy single Microsoft renewal date into the vendor renewal
 * calendar. Run after db:push. Idempotent per tenant: an existing Microsoft
 * 365 renewal row always wins.
 *
 *   DATABASE_URL=postgres://... npx tsx scripts/backfill-vendor-renewals.ts
 */
import { and, eq, isNotNull } from "drizzle-orm";

const main = async () => {
  // Standalone scripts do not get Next.js' environment bootstrap. These
  // defaults only satisfy server configuration validation; database selection
  // still comes exclusively from DATABASE_URL (or local PGlite when absent).
  Object.assign(process.env, {
    NODE_ENV: process.env.NODE_ENV ?? "development",
    AUTH_PROVIDER: process.env.AUTH_PROVIDER ?? "entra",
    AUTH_SECRET: process.env.AUTH_SECRET ?? "local-backfill-only",
  });
  const [{ db }, { tenants, vendorRenewals }] = await Promise.all([
    import("../src/server/db"),
    import("../src/server/db/schema"),
  ]);
  const rows = await db.query.tenants.findMany({
    where: isNotNull(tenants.renewalDate),
    columns: { id: true, renewalDate: true },
  });
  let inserted = 0;
  for (const tenant of rows) {
    const existing = await db.query.vendorRenewals.findFirst({
      where: and(
        eq(vendorRenewals.tenantId, tenant.id),
        eq(vendorRenewals.vendor, "Microsoft 365"),
      ),
      columns: { id: true },
    });
    if (existing || !tenant.renewalDate) continue;
    await db.insert(vendorRenewals).values({
      tenantId: tenant.id,
      vendor: "Microsoft 365",
      contractName: "Microsoft agreement",
      renewalDate: tenant.renewalDate,
      noticeDays: 0,
    });
    inserted++;
  }
  console.log(`Backfilled ${inserted} Microsoft renewal(s).`);
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Renewal backfill failed:", error);
    process.exit(1);
  });
