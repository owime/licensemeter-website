import { desc, eq, sql } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";

import { Card, buttonClass } from "~/components/ui";
import { fmtDateTime } from "~/lib/format";
import { requireAccess } from "~/server/access";
import { db } from "~/server/db";
import { syncRuns } from "~/server/db/schema";

export const metadata: Metadata = {
  title: "Sync history",
  robots: { index: false, follow: false },
};

const PAGE_SIZE = 30;

const statusDot = (status: string): string =>
  status === "success"
    ? "bg-moss"
    : status === "running"
      ? "bg-gold motion-safe:animate-pulse"
      : status === "partial"
        ? "bg-gold"
        : "bg-danger";

export default async function SyncHistoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const ctx = await requireAccess("viewer");
  const sp = await searchParams;

  const total = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(syncRuns)
    .where(eq(syncRuns.tenantId, ctx.tenant.id))
    .then((r) => r[0]?.n ?? 0);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageRaw = typeof sp.page === "string" ? parseInt(sp.page, 10) : 1;
  const page = Math.min(
    Math.max(Number.isFinite(pageRaw) ? pageRaw : 1, 1),
    totalPages,
  );

  const runs = await db.query.syncRuns.findMany({
    where: eq(syncRuns.tenantId, ctx.tenant.id),
    orderBy: desc(syncRuns.startedAt),
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  const pageHref = (n: number) =>
    `/app/settings/sync-history${n > 1 ? `?page=${n}` : ""}`;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 pb-8">
      <header className="rise rise-1">
        <nav
          aria-label="Breadcrumb"
          className="text-xs font-medium tracking-[0.2em] text-ink-faint uppercase"
        >
          <Link
            href="/app/settings"
            className="underline-offset-4 hover:text-ink hover:underline"
          >
            Settings
          </Link>{" "}
          / <span aria-current="page" className="text-ink-soft">Sync history</span>
        </nav>
        <h1 className="mt-2 font-display text-3xl tracking-tight">
          Sync history
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          {total} {total === 1 ? "run" : "runs"} recorded for this workspace.
        </p>
      </header>

      <div className="rise rise-2">
        <Card title="Runs">
          {runs.length === 0 ? (
            <p className="text-sm text-ink-soft">No syncs yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {runs.map((run) => (
                <li
                  key={run.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2 text-sm last:border-b-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className={`inline-block size-2 rounded-full ${statusDot(run.status)}`}
                    />
                    <span className="font-medium capitalize">{run.status}</span>
                    <span className="text-ink-faint">
                      {fmtDateTime(run.startedAt)}
                    </span>
                  </div>
                  <div className="min-w-0 font-mono text-[11px] break-words text-ink-soft">
                    {run.steps
                      .map(
                        (s) =>
                          `${s.step}${s.count !== undefined ? `:${s.count}` : ""}${
                            s.status === "ok" ? "" : ` (${s.status})`
                          }`,
                      )
                      .join(" · ") || (run.error ?? "")}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {total > PAGE_SIZE && (
        <nav
          aria-label="Sync history pages"
          className="flex flex-wrap items-center justify-between gap-3"
        >
          <span className="tnum text-xs text-ink-soft">
            Showing {(page - 1) * PAGE_SIZE + 1} to{" "}
            {Math.min(page * PAGE_SIZE, total)} of {total}
          </span>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link href={pageHref(page - 1)} className={buttonClass("micro")}>
                ← Previous
              </Link>
            )}
            {page < totalPages && (
              <Link href={pageHref(page + 1)} className={buttonClass("micro")}>
                Next →
              </Link>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
