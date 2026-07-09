/** Billing-specific skeleton: narrower than the Overview shell (max-w-3xl,
 * two stacked cards) so the page does not shift as it streams in. */
export default function Loading() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6" aria-busy="true">
      <div className="bg-line h-9 w-32 motion-safe:animate-pulse" />
      <div className="border-line bg-card h-40 rounded-2xl border motion-safe:animate-pulse" />
      <div className="border-line bg-card h-64 rounded-2xl border motion-safe:animate-pulse" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
