import type { Metadata } from "next";
import Link from "next/link";

import { mspEnabled } from "~/env";
import { Card, Pill, buttonClass } from "~/components/ui";
import type { PillTone } from "~/components/ui";
import { MspBillingActions } from "~/components/workspace/MspBillingActions";
import { MspCreateForm } from "~/components/workspace/MspCreateForm";
import { MspPortfolioActions } from "~/components/workspace/MspPortfolioActions";
import { OpenWorkspaceButton } from "~/components/workspace/OpenWorkspaceButton";
import { normalizeCurrencyCents } from "~/lib/currency";
import { fmtDate, fmtMoney, fmtNumber } from "~/lib/format";
import {
  MSP_LARGE_TENANT_SEATS,
  MSP_PRICE_ANNUAL_EUR,
  MSP_PRICE_EUR,
} from "~/lib/plans";
import { hasRole, requireAccess } from "~/server/access";
import {
  attachWorkspace,
  createMspAccount,
  currentMspAccount,
  detachWorkspace,
  mspPortfolio,
} from "~/server/msp";
import type { SubscriptionStatus } from "~/server/types";

/* Auth gates this route; noindex closes the gap robots.txt leaves. */
export const metadata: Metadata = {
  title: "MSP portfolio",
  robots: { index: false, follow: false },
};

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  active: "Active",
  trialing: "Free trial",
  past_due: "Past due",
  canceled: "Cancelled",
  unpaid: "Unpaid",
  incomplete: "Payment incomplete",
  incomplete_expired: "Payment incomplete",
  paused: "Paused",
};

const STATUS_TONE: Record<SubscriptionStatus, PillTone> = {
  active: "good",
  trialing: "brand",
  past_due: "gold",
  canceled: "slate",
  unpaid: "danger",
  incomplete: "danger",
  incomplete_expired: "danger",
  paused: "slate",
};

/** Statuses we treat as a live subscription that is managed via the portal. */
const MANAGEABLE: ReadonlySet<SubscriptionStatus> = new Set([
  "active",
  "trialing",
  "past_due",
]);

const LARGE_TENANT_LABEL = fmtNumber(MSP_LARGE_TENANT_SEATS, "EUR");

export default async function MspPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // The nav link is already gated on mspEnabled(), but the route is directly
  // reachable by URL (marketing /msp links here). Explain the flag-off state
  // instead of redirecting; the create/attach pathway stays unreachable.
  if (!mspEnabled()) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <header className="rise rise-1">
          <h1 className="font-display text-3xl tracking-tight">
            MSP portfolio
          </h1>
        </header>
        <div className="rise rise-2">
          <Card title="Not available">
            <p className="text-ink-soft text-sm">
              MSP billing is not configured on this deployment, so portfolio
              accounts cannot be created here. If you expected it, contact the
              person who runs this deployment.
            </p>
          </Card>
        </div>
      </div>
    );
  }
  // The demo session can't own an MSP account (createMspAccount rejects demo
  // identities), so don't show a create form that would only fail server-side.
  const ctx = await requireAccess("viewer");
  if (ctx.tenant.isDemo) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <header className="rise rise-1">
          <h1 className="font-display text-3xl tracking-tight">
            MSP portfolio
          </h1>
        </header>
        <div className="rise rise-2">
          <Card title="MSP portfolio preview">
            <div className="flex flex-col gap-4">
              <p className="text-ink-soft text-sm">
                A real MSP account binds client workspaces you own onto one
                subscription and sorts them by recoverable waste.
              </p>
              <div className="border-line bg-line grid gap-px border sm:grid-cols-3">
                {[
                  ["Client workspaces", "12"],
                  ["Monthly spend", "€ 84,200"],
                  ["Recoverable waste", "€ 11,740"],
                ].map(([label, value]) => (
                  <div key={label} className="bg-card p-4">
                    <p className="text-ink-faint text-[11px] font-medium uppercase">
                      {label}
                    </p>
                    <p className="font-display mt-2 text-2xl">{value}</p>
                  </div>
                ))}
              </div>
              <p className="text-ink-faint text-xs">
                Each row includes sync health, seats, spend, findings, and a
                direct path into that client workspace. Demo figures here are
                illustrative and do not create portfolio records.
              </p>
              <Link
                href="/msp"
                className={buttonClass("secondary", "self-start")}
              >
                Explore MSP Packaging
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }
  // MSP ownership itself is identity-based and cross-tenant, but creating or
  // billing an account from here requires a workspace owner (matching the
  // billing page); the server actions re-verify.
  const isOwner = hasRole(ctx, "owner");
  const account = await currentMspAccount();
  const sp = await searchParams;
  const checkoutParam =
    typeof sp.checkout === "string" ? sp.checkout : undefined;

  if (!account) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <header className="rise rise-1">
          <h1 className="font-display text-3xl tracking-tight">
            MSP portfolio
          </h1>
          <p className="text-ink-soft mt-1 text-sm">
            One workspace per client tenant. One waste ledger across them all.
          </p>
        </header>

        <div className="rise rise-2">
          <Card title="Create your MSP account">
            <div className="flex flex-col gap-4">
              <p className="text-ink-soft text-sm leading-relaxed">
                An MSP account binds the client workspaces you own into a single
                portfolio, billed by quantity on one subscription. You attach a
                client tenant and it inherits entitlement from the account —{" "}
                <span className="text-ink font-medium">
                  € {fmtNumber(MSP_PRICE_EUR, "EUR")}
                </span>{" "}
                per attached client tenant a month, or €{" "}
                {fmtNumber(MSP_PRICE_ANNUAL_EUR, "EUR")} a year (two months
                free). Client tenants over {LARGE_TENANT_LABEL} seats are priced
                separately.
              </p>
              {isOwner ? (
                <MspCreateForm action={createMspAccount} />
              ) : (
                <p className="text-ink-soft text-sm">
                  Creating an MSP account requires a workspace owner.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const reportingCurrency = ctx.tenant.currency;
  const reportingRatePpm = ctx.tenant.currencyRatePpm;
  const portfolio = (await mspPortfolio()).map((row) => ({
    ...row,
    reportingSpendCents: row.summary
      ? normalizeCurrencyCents(
          row.summary.spendCents,
          row.currencyRatePpm,
          reportingRatePpm,
        )
      : null,
    reportingWasteCents: row.summary
      ? normalizeCurrencyCents(
          row.summary.wasteCents,
          row.currencyRatePpm,
          reportingRatePpm,
        )
      : null,
  }));
  // Attached first, then by waste desc within each group (mspPortfolio already
  // sorts by waste, but mixes attached/unattached; this groups the billed
  // tenants to the top where the QBR numbers live).
  const rows = [...portfolio].sort((a, b) => {
    if (a.attached !== b.attached) return a.attached ? -1 : 1;
    return (b.reportingWasteCents ?? -1) - (a.reportingWasteCents ?? -1);
  });

  const attachedRows = rows.filter((r) => r.attached && r.summary);
  const portfolioTotals = attachedRows.reduce(
    (acc, r) => ({
      spendCents: acc.spendCents + (r.reportingSpendCents ?? 0),
      wasteCents: acc.wasteCents + (r.reportingWasteCents ?? 0),
      openFindings: acc.openFindings + (r.summary?.openFindings ?? 0),
    }),
    { spendCents: 0, wasteCents: 0, openFindings: 0 },
  );

  const status = account.subscriptionStatus;
  const subscribed = Boolean(account.stripeSubscriptionId);
  const manageable = subscribed && status !== null && MANAGEABLE.has(status);
  const attachedCount = rows.filter((r) => r.attached).length;
  const interval = account.interval;
  const unitPrice = interval === "year" ? MSP_PRICE_ANNUAL_EUR : MSP_PRICE_EUR;
  const intervalSuffix = interval === "year" ? "yr" : "mo";

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <header className="rise rise-1">
        <h1 className="font-display text-3xl tracking-tight">MSP portfolio</h1>
        <p className="text-ink-soft mt-1 text-sm">
          {account.name ??
            "Every client tenant you own, billed on one subscription."}
        </p>
      </header>

      <div className="rise rise-2">
        <Card title="Billing">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3">
                {subscribed && status ? (
                  <>
                    <Pill tone={STATUS_TONE[status]}>
                      {STATUS_LABEL[status]}
                    </Pill>
                    {interval && (
                      <span className="text-sm">
                        <span className="font-medium">
                          € {fmtNumber(unitPrice, "EUR")}
                        </span>{" "}
                        <span className="text-ink-soft">
                          / tenant / {intervalSuffix}
                        </span>
                      </span>
                    )}
                  </>
                ) : (
                  <Pill tone="slate">Not subscribed yet</Pill>
                )}
              </div>
              <p className="text-ink-soft text-sm">
                {attachedCount === 1
                  ? "1 attached tenant"
                  : `${attachedCount} attached tenants`}{" "}
                {subscribed ? "billed on this subscription." : "ready to bill."}
              </p>
              {account.cancelAtPeriodEnd && account.currentPeriodEnd ? (
                <p className="text-ink-soft text-sm">
                  Cancels on {fmtDate(account.currentPeriodEnd)}
                </p>
              ) : status === "trialing" && account.currentPeriodEnd ? (
                <p className="text-ink-soft text-sm">
                  Free trial — first charge {fmtDate(account.currentPeriodEnd)}
                </p>
              ) : subscribed && account.currentPeriodEnd ? (
                <p className="text-ink-soft text-sm">
                  Renews on {fmtDate(account.currentPeriodEnd)}
                </p>
              ) : null}
            </div>
            {isOwner ? (
              <MspBillingActions
                manageable={manageable}
                checkoutParam={checkoutParam}
              />
            ) : (
              <p className="text-ink-soft text-sm">
                Billing is managed by a workspace owner.
              </p>
            )}
          </div>
        </Card>
      </div>

      {attachedRows.length > 0 && (
        <section className="rise rise-3 border-line bg-line grid gap-px border sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Attached tenants",
              value: fmtNumber(attachedRows.length, "EUR"),
            },
            {
              label: "Open findings",
              value: fmtNumber(portfolioTotals.openFindings, "EUR"),
            },
            {
              label: "Monthly spend",
              value: fmtMoney(portfolioTotals.spendCents, reportingCurrency),
            },
            {
              label: "Monthly waste",
              value: fmtMoney(portfolioTotals.wasteCents, reportingCurrency),
              waste: true,
            },
          ].map((c) => (
            <div key={c.label} className="bg-card p-5">
              <div className="text-ink-faint text-[11px] font-medium tracking-[0.16em] uppercase">
                {c.label}
              </div>
              <div
                className={`tnum font-display mt-2 text-2xl tracking-tight ${
                  c.waste ? "text-waste-text" : ""
                }`}
              >
                {c.value}
              </div>
            </div>
          ))}
        </section>
      )}

      <div className="rise rise-3">
        <Card title="Portfolio">
          {rows.length === 0 ? (
            <p className="text-ink-soft text-sm">
              You don&rsquo;t own any client workspaces yet. Connect a client
              tenant, then attach it here to bill it on this account.
            </p>
          ) : (
            <div className="-mx-5 -my-4 hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <caption className="sr-only">
                  Client workspaces in this portfolio with seats, spend, waste
                  and open findings.
                </caption>
                <thead>
                  <tr className="border-line text-ink-faint border-b text-left text-[11px] tracking-[0.14em] uppercase">
                    <th scope="col" className="px-5 py-3 font-medium">
                      Workspace
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-right font-medium"
                    >
                      Seats
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-right font-medium"
                    >
                      Spend / mo
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-right font-medium"
                    >
                      Waste / mo
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-right font-medium"
                    >
                      Findings
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-3 text-right font-medium"
                    >
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const blocked =
                      row.hasSync && row.seats > MSP_LARGE_TENANT_SEATS;
                    return (
                      <tr
                        key={row.tenantId}
                        className="border-line border-b last:border-b-0"
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{row.name}</span>
                            {row.attached && <Pill tone="brand">Attached</Pill>}
                          </div>
                        </td>
                        <td className="tnum px-4 py-3 text-right font-mono">
                          {row.hasSync
                            ? fmtNumber(row.seats, row.currency)
                            : "-"}
                        </td>
                        <td className="tnum px-4 py-3 text-right font-mono">
                          {row.summary
                            ? fmtMoney(row.summary.spendCents, row.currency)
                            : "-"}
                        </td>
                        <td className="tnum text-waste-text px-4 py-3 text-right font-mono">
                          {row.summary
                            ? fmtMoney(row.summary.wasteCents, row.currency)
                            : "-"}
                        </td>
                        <td className="tnum px-4 py-3 text-right font-mono">
                          {row.summary
                            ? fmtNumber(row.summary.openFindings, row.currency)
                            : "-"}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <OpenWorkspaceButton
                              tenantId={row.tenantId}
                              name={row.name}
                            />
                            <MspPortfolioActions
                              tenantId={row.tenantId}
                              attached={row.attached}
                              blocked={blocked}
                              blockedReason={`Over ${LARGE_TENANT_LABEL} seats - priced separately, contact us`}
                              attachAction={attachWorkspace}
                              detachAction={detachWorkspace}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {rows.length > 0 && (
            <ul className="-mx-1 mt-1 flex flex-col gap-3 md:hidden">
              {rows.map((row) => {
                const blocked =
                  row.hasSync && row.seats > MSP_LARGE_TENANT_SEATS;
                return (
                  <li
                    key={row.tenantId}
                    className="border-line bg-card border p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{row.name}</span>
                      {row.attached && <Pill tone="brand">Attached</Pill>}
                    </div>
                    <dl className="tnum mt-3 grid grid-cols-2 gap-x-6 gap-y-2 font-mono text-sm">
                      <div className="flex justify-between gap-2">
                        <dt className="text-ink-faint font-sans text-xs">
                          Seats
                        </dt>
                        <dd>
                          {row.hasSync
                            ? fmtNumber(row.seats, row.currency)
                            : "-"}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-ink-faint font-sans text-xs">
                          Findings
                        </dt>
                        <dd>
                          {row.summary
                            ? fmtNumber(row.summary.openFindings, row.currency)
                            : "-"}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-ink-faint font-sans text-xs">
                          Spend/mo
                        </dt>
                        <dd>
                          {row.summary
                            ? fmtMoney(row.summary.spendCents, row.currency)
                            : "-"}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-ink-faint font-sans text-xs">
                          Waste/mo
                        </dt>
                        <dd className="text-waste-text">
                          {row.summary
                            ? fmtMoney(row.summary.wasteCents, row.currency)
                            : "-"}
                        </dd>
                      </div>
                    </dl>
                    <div className="border-line mt-3 flex items-center justify-end gap-2 border-t pt-3">
                      <OpenWorkspaceButton
                        tenantId={row.tenantId}
                        name={row.name}
                      />
                      <MspPortfolioActions
                        tenantId={row.tenantId}
                        attached={row.attached}
                        blocked={blocked}
                        blockedReason={`Over ${LARGE_TENANT_LABEL} seats - priced separately, contact us`}
                        attachAction={attachWorkspace}
                        detachAction={detachWorkspace}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
