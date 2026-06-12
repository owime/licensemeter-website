/** Skeleton while a dash page streams in. Pulse only when motion is allowed. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl" aria-busy="true">
      <div className="h-9 w-44 bg-line motion-safe:animate-pulse" />
      <div className="mt-8 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-card p-5">
            <div className="h-3 w-24 bg-line motion-safe:animate-pulse" />
            <div className="mt-3 h-8 w-32 bg-line motion-safe:animate-pulse" />
          </div>
        ))}
      </div>
      <div className="mt-10 h-64 border border-line bg-card motion-safe:animate-pulse" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
