/** Skeleton while a dash page streams in. Pulse only when motion is allowed.
 * Mirrors the Overview layout (header, metric cards, trend, inventory table,
 * findings list) so the page does not jump as each section streams in. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl" aria-busy="true">
      {/* Header: title + freshness line */}
      <div className="h-9 w-44 bg-line motion-safe:animate-pulse" />
      <div className="mt-2 h-4 w-56 bg-line motion-safe:animate-pulse" />

      {/* Metric cards */}
      <div className="mt-8 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-card p-5">
            <div className="h-3 w-24 bg-line motion-safe:animate-pulse" />
            <div className="mt-3 h-8 w-32 bg-line motion-safe:animate-pulse" />
            <div className="mt-2 h-3 w-20 bg-line motion-safe:animate-pulse" />
          </div>
        ))}
      </div>

      {/* Trend chart */}
      <div className="mt-10 h-3 w-20 bg-line motion-safe:animate-pulse" />
      <div className="mt-3 h-56 border border-line bg-card motion-safe:animate-pulse" />

      {/* License inventory */}
      <div className="mt-10 h-3 w-32 bg-line motion-safe:animate-pulse" />
      <div className="mt-3 border border-line bg-card">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-4 border-b border-line px-4 py-4 last:border-b-0"
          >
            <div className="h-4 w-40 bg-line motion-safe:animate-pulse" />
            <div className="h-4 w-24 bg-line motion-safe:animate-pulse" />
          </div>
        ))}
      </div>

      {/* Largest open findings */}
      <div className="mt-10 h-3 w-36 bg-line motion-safe:animate-pulse" />
      <div className="mt-3 border border-line bg-card">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-4 border-b border-line px-4 py-4 last:border-b-0"
          >
            <div className="h-4 w-48 bg-line motion-safe:animate-pulse" />
            <div className="h-4 w-16 bg-line motion-safe:animate-pulse" />
          </div>
        ))}
      </div>

      <span className="sr-only">Loading…</span>
    </div>
  );
}
