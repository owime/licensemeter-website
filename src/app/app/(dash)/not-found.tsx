import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-3xl tracking-tight">Not found</h1>
      <p className="mt-2 max-w-md text-sm text-ink-soft">
        This page or record does not exist in this workspace. It may have
        been removed by a later sync.
      </p>
      <Link
        href="/app/findings"
        className="mt-4 inline-block text-xs text-ink-soft underline-offset-4 hover:text-ink hover:underline"
      >
        ← Back to findings
      </Link>
    </div>
  );
}
