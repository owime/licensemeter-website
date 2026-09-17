import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ConnectorLogo } from "~/components/ConnectorLogo";
import { Card, buttonClass } from "~/components/ui";
import { SpendChart } from "~/components/workspace/SpendChart";
import { CONNECTOR_LABELS } from "~/lib/connectors";
import { fmtMoney } from "~/lib/format";
import type { getAiPreview } from "~/server/demo/aiPreview";

export async function AiConnectorPreview({
  preview,
  isDemo,
}: {
  preview: Awaited<ReturnType<typeof getAiPreview>>;
  isDemo: boolean;
}) {
  const t = await getTranslations("aiCosts");
  const label = CONNECTOR_LABELS[preview.provider];
  const cutoff = new Date(Date.now() - 30 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const monthlySpend = preview.spend
    .filter((r) => r.day >= cutoff)
    .reduce((sum, r) => sum + r.amountCents, 0);
  const daily = new Map<string, number>();
  for (const row of preview.spend)
    daily.set(row.day, (daily.get(row.day) ?? 0) + row.amountCents);
  return (
    <section aria-label={t("connectorPreview.sampleOverviewLabel", { label })}>
      <div className="border-line bg-card flex flex-wrap items-center justify-between gap-5 rounded-xl border p-5">
        <div className="flex items-center gap-4">
          <ConnectorLogo brand={preview.provider} size={40} />
          <div>
            <h2 className="font-medium">
              {t("connectorPreview.sampleSpendTitle", { label })}
            </h2>
            <p className="text-ink-soft mt-1 text-xs">
              {t("connectorPreview.last30DaysUsd")}
            </p>
          </div>
        </div>
        <p className="tnum font-display text-3xl tracking-tight">
          {fmtMoney(monthlySpend, "USD")}
        </p>
      </div>
      <SpendChart
        sample
        series={[
          { label, points: [...daily].map(([day, cents]) => ({ day, cents })) },
        ]}
      />
      <div className="mt-6">
        <Card title={t("connectorPreview.sampleMembersTitle")}>
          <p className="text-ink-soft mb-4 text-sm">
            {t("connectorPreview.sampleMembersDescription")}
          </p>
          <ul className="divide-line divide-y">
            {preview.members.map((member) => (
              <li
                key={member.email}
                className="flex flex-wrap items-center justify-between gap-2 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium break-words">
                    {member.displayName ?? member.email.split("@")[0]}
                  </p>
                  <p className="text-ink-soft mt-1 text-xs break-all">
                    {member.email}
                  </p>
                </div>
                <span className="bg-brand-soft text-brand-text rounded-full px-2.5 py-1 text-xs">
                  {t("connectorPreview.consoleMember")}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <Link
        href={`/app/ai-costs${isDemo ? "" : "?preview=sample"}`}
        className={buttonClass("secondary", "mt-4")}
      >
        {t("connectorPreview.viewAllCosts")}
      </Link>
    </section>
  );
}
