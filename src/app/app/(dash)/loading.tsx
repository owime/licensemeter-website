/** Skeleton while a dash page streams in. Pulse only when motion is allowed.
 * Mirrors the Overview layout (header, metric cards, trend, inventory table,
 * findings list) so the page does not jump as each section streams in. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl" aria-busy="true">
      {/* Header: title + freshness line */}
      <div className="bg-line h-9 w-44 motion-safe:animate-pulse" />
      <div className="bg-line mt-2 h-4 w-56 motion-safe:animate-pulse" />

      {/* Metric cards */}
      <div className="border-line bg-line mt-8 grid gap-px border sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-card p-5">
            <div className="bg-line h-3 w-24 motion-safe:animate-pulse" />
            <div className="bg-line mt-3 h-8 w-32 motion-safe:animate-pulse" />
            <div className="bg-line mt-2 h-3 w-20 motion-safe:animate-pulse" />
          </div>
        ))}
      </div>

      {/* Trend chart */}
      <div className="bg-line mt-10 h-3 w-20 motion-safe:animate-pulse" />
      <div className="border-line bg-card mt-3 h-56 border motion-safe:animate-pulse" />

      {/* License inventory */}
      <div className="bg-line mt-10 h-3 w-32 motion-safe:animate-pulse" />
      <div className="border-line bg-card mt-3 border">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="border-line flex items-center justify-between gap-4 border-b px-4 py-4 last:border-b-0"
          >
            <div className="bg-line h-4 w-40 motion-safe:animate-pulse" />
            <div className="bg-line h-4 w-24 motion-safe:animate-pulse" />
          </div>
        ))}
      </div>

      {/* Largest open findings */}
      <div className="bg-line mt-10 h-3 w-36 motion-safe:animate-pulse" />
      <div className="border-line bg-card mt-3 border">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="border-line flex items-center justify-between gap-4 border-b px-4 py-4 last:border-b-0"
          >
            <div className="bg-line h-4 w-48 motion-safe:animate-pulse" />
            <div className="bg-line h-4 w-16 motion-safe:animate-pulse" />
          </div>
        ))}
      </div>

      <span className="sr-only">Loading…</span>
    </div>
  );
}
