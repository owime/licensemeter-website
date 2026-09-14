import Link from "next/link";

export function AiSampleNotice({ exitHref }: { exitHref?: string }) {
  return (
    <aside
      className="border-brand/20 bg-brand-soft text-brand-text mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 text-sm"
      aria-label="Sample data notice"
    >
      <div>
        <p className="font-semibold">Sample data</p>
        <p className="mt-1">
          Fictional spend and members for your demo. No API keys required.
        </p>
      </div>
      {exitHref && (
        <Link
          href={exitHref}
          className="hover:text-ink inline-flex min-h-11 items-center font-medium underline underline-offset-4"
        >
          Exit preview
        </Link>
      )}
    </aside>
  );
}
