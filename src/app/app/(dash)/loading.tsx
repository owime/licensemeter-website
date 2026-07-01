/** Skeleton while a dash page streams in. Pulse only when motion is allowed.
 * Kept neutral (title bar + generic blocks): this file serves every dash
 * route, so it must not imply any one page's layout. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl" aria-busy="true">
      <div className="bg-line h-9 w-44 motion-safe:animate-pulse" />
      <div className="bg-line mt-3 h-4 w-72 motion-safe:animate-pulse" />
      <div className="border-line bg-card mt-8 h-40 border motion-safe:animate-pulse" />
      <div className="border-line bg-card mt-6 h-64 border motion-safe:animate-pulse" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
