import { and, desc, eq, inArray } from "drizzle-orm";
import type { Metadata } from "next";
import { CircleCheck, KeyRound } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { cache } from "react";

import { EmptyState } from "~/components/workspace/EmptyState";
import { FindingChip } from "~/components/workspace/FindingChip";
import { Pill } from "~/components/ui";
import { fmtDate, fmtMoney } from "~/lib/format";
import { skuDisplayName } from "~/server/graph/skuCatalog";
import { requireAccess } from "~/server/access";
import { db } from "~/server/db";
import { findings, priceBook, tenantUsers } from "~/server/db/schema";

/**
 * Access check + tenant-scoped user lookup, memoized for the request so
 * generateMetadata and the page share one auth resolution and one query
 * (React cache dedupes within a single render pass).
 */
const loadUser = cache(async (id: string) => {
  const ctx = await requireAccess("viewer");
  const user = await db.query.tenantUsers.findFirst({
    where: and(
      eq(tenantUsers.tenantId, ctx.tenant.id),
      eq(tenantUsers.graphId, id),
    ),
  });
  return { ctx, user };
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { user } = await loadUser(id);
  return { title: user ? (user.displayName ?? user.upn) : "User detail" };
}

const ACTIVITY_LABEL_KEYS = [
  "exchange",
  "oneDrive",
  "sharePoint",
  "teams",
  "copilot",
] as const;

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("users");
  const { ctx, user } = await loadUser(id);
  if (!user) notFound();

  // Only price the SKUs this user actually holds, rather than loading the whole
  // tenant price book to look up a handful of ids.
  const userSkuIds = user.licenses.map((l) => l.skuId);

  const [userFindings, prices] = await Promise.all([
    db.query.findings.findMany({
      where: and(
        eq(findings.tenantId, ctx.tenant.id),
        eq(findings.graphUserId, id),
      ),
      orderBy: desc(findings.monthlyImpactCents),
      // A user's findings are bounded by the rule set, but cap defensively.
      limit: 100,
    }),
    userSkuIds.length > 0
      ? db.query.priceBook.findMany({
          where: and(
            eq(priceBook.tenantId, ctx.tenant.id),
            inArray(priceBook.skuId, userSkuIds),
          ),
        })
      : Promise.resolve([]),
  ]);
  const priceBySku = new Map(prices.map((p) => [p.skuId, p.monthlyPriceCents]));
  const monthlyCost = user.licenses.reduce(
    (sum, l) => sum + (priceBySku.get(l.skuId) ?? 0),
    0,
  );
  const currency = ctx.tenant.currency;

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/app/findings"
        className="text-ink-soft hover:text-ink text-xs underline-offset-4 hover:underline"
      >
        {t("backToFindings")}
      </Link>

      <header className="rise rise-1 mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-tight">
            {user.displayName ?? user.upn}
          </h1>
          <p className="text-ink-soft mt-1 font-mono text-sm break-all">
            {user.upn}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Pill tone={user.accountEnabled ? "moss" : "danger"}>
            {user.accountEnabled ? t("enabled") : t("disabled")}
          </Pill>
          {user.userType === "Guest" && <Pill tone="teal">{t("guest")}</Pill>}
        </div>
      </header>

      <section className="rise rise-2 border-line bg-line mt-8 grid gap-px border sm:grid-cols-3">
        {[
          {
            label: t("stats.monthlyLicenseCost"),
            value: fmtMoney(monthlyCost, currency),
          },
          {
            label: t("stats.lastActivity"),
            value: fmtDate(user.lastActivity),
          },
          {
            label: t("stats.accountCreated"),
            value: fmtDate(user.createdDateTime),
          },
        ].map((c) => (
          <div key={c.label} className="bg-card p-5">
            <div className="text-ink-faint text-[11px] font-medium tracking-[0.16em] uppercase">
              {c.label}
            </div>
            <div className="tnum font-display mt-2 text-2xl tracking-tight">
              {c.value}
            </div>
          </div>
        ))}
      </section>

      <section className="rise rise-3 mt-8">
        <h2 className="text-ink-faint text-xs font-medium tracking-[0.18em] uppercase">
          {t("licenses.title")}
        </h2>
        <ul className="border-line bg-card mt-3 border">
          {user.licenses.map((l) => (
            <li
              key={l.skuId}
              className="border-line flex flex-wrap items-baseline justify-between gap-2 border-b px-4 py-3 last:border-b-0"
            >
              <div>
                <span className="font-medium">{skuDisplayName(l.skuId)}</span>
                {l.assignedByGroup && (
                  <details className="ml-2 inline-block align-middle">
                    <summary className="text-ink-faint hover:text-ink inline-flex min-h-11 cursor-pointer touch-manipulation items-center text-xs underline-offset-4 hover:underline">
                      {t("licenses.assignedByGroup")}
                    </summary>
                    <span className="text-ink-faint block max-w-xs font-mono text-[11px] break-all">
                      {t("licenses.groupId", { id: l.assignedByGroup })}
                    </span>
                  </details>
                )}
                {l.disabledPlans.length > 0 && (
                  <span className="text-gold-text ml-2 text-xs">
                    {t("licenses.plansDisabled", {
                      count: l.disabledPlans.length,
                    })}
                  </span>
                )}
              </div>
              <span className="tnum font-mono text-sm">
                {t("licenses.perMonth", {
                  amount: fmtMoney(priceBySku.get(l.skuId) ?? 0, currency),
                })}
              </span>
            </li>
          ))}
          {user.licenses.length === 0 && (
            <li>
              <EmptyState
                icon={KeyRound}
                heading={t("licenses.noLicenses")}
              />
            </li>
          )}
        </ul>
      </section>

      <section className="rise rise-4 mt-8">
        <h2 className="text-ink-faint text-xs font-medium tracking-[0.18em] uppercase">
          {t("activityByWorkload.title")}
        </h2>
        <dl className="tnum border-line bg-line mt-3 grid grid-cols-2 gap-px border font-mono text-sm sm:grid-cols-5">
          {ACTIVITY_LABEL_KEYS.map((key, index) => (
            <div
              key={key}
              className={`bg-card p-4 ${index === 4 ? "max-sm:col-span-2" : ""}`}
            >
              <dt className="text-ink-faint font-sans text-xs">
                {t(`activityByWorkload.${key}`)}
              </dt>
              <dd className="mt-1">
                {fmtDate(user.workloadActivity?.[key] ?? null)}
              </dd>
            </div>
          ))}
        </dl>
        <p className="text-ink-faint mt-2 text-xs">
          {t("activityByWorkload.footer", {
            interactive: fmtDate(user.lastInteractiveSignIn),
            nonInteractive: fmtDate(user.lastNonInteractiveSignIn),
            synced: fmtDate(user.syncedAt),
          })}
        </p>
      </section>

      <section className="rise rise-5 mt-8 mb-8">
        <h2 className="text-ink-faint text-xs font-medium tracking-[0.18em] uppercase">
          {t("findings.title")}
        </h2>
        <ul className="border-line bg-card mt-3 border">
          {userFindings.map((f) => (
            <li key={f.id} className="border-line border-b last:border-b-0">
              <Link
                href={`/app/findings/${f.id}`}
                className="hover:bg-canvas flex flex-wrap items-center justify-between gap-2 px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <FindingChip rule={f.rule} detail={f.detail} />
                  <span className="truncate text-sm underline-offset-4 group-hover:underline">
                    {f.title}
                  </span>
                  <Pill
                    tone={
                      f.status === "open"
                        ? "brand"
                        : f.status === "acknowledged"
                          ? "outline"
                          : "moss"
                    }
                  >
                    {f.status}
                  </Pill>
                </div>
                <span className="tnum text-waste-text shrink-0 font-mono text-sm font-medium">
                  {f.monthlyImpactCents > 0
                    ? t("findings.perMonth", {
                        amount: fmtMoney(f.monthlyImpactCents, currency),
                      })
                    : "-"}
                </span>
              </Link>
            </li>
          ))}
          {userFindings.length === 0 && (
            <li>
              <EmptyState
                icon={CircleCheck}
                heading={t("findings.noFindings")}
              />
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
