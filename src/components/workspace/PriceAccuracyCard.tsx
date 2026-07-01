import { ButtonLink, Card } from "~/components/ui";

/**
 * Nudge shown while every price book row is still a list-price default
 * (no custom price entered yet), so money figures read as estimates.
 */
export const PriceAccuracyCard = () => (
  <Card title="Price accuracy">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <p className="text-ink-soft max-w-2xl text-sm">
        Your waste figures use Microsoft list prices. Enter what you actually
        pay for accurate numbers.
      </p>
      <ButtonLink href="/app/licenses">Set your prices</ButtonLink>
    </div>
  </Card>
);
