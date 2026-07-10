import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-3xl tracking-tight">Not found</h1>
      <p className="text-ink-soft mt-2 max-w-md text-sm">
        This page or record does not exist in this workspace. It may have been
        removed by a later sync.
      </p>
      <Link
        href="/app/findings"
        className="text-ink-soft hover:text-ink mt-4 inline-flex min-h-11 items-center text-xs underline-offset-4 hover:underline"
      >
        ← Back to findings
      </Link>
    </div>
  );
}
