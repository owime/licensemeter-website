import type { SupportedCurrency } from "./currency";

export type EcbReferenceRates = {
  asOf: string;
  /** Units of each currency per EUR. */
  perEur: Partial<Record<SupportedCurrency, number>> & { EUR: 1 };
};

/** Parse the small, public ECB daily reference-rate XML document. */
export const parseEcbReferenceRates = (xml: string): EcbReferenceRates => {
  const asOf = /time=["'](\d{4}-\d{2}-\d{2})["']/.exec(xml)?.[1];
  if (!asOf) throw new Error("ECB reference-rate date is missing");

  const perEur: Record<string, number> = { EUR: 1 };
  for (const match of xml.matchAll(
    /currency=["']([A-Z]{3})["'][^>]*rate=["']([0-9.]+)["']/g,
  )) {
    const rate = Number(match[2]);
    if (Number.isFinite(rate) && rate > 0) perEur[match[1]!] = rate;
  }

  return { asOf, perEur: perEur as EcbReferenceRates["perEur"] };
};

export const rateBetween = (
  rates: EcbReferenceRates,
  from: SupportedCurrency,
  to: SupportedCurrency,
): number => {
  const fromPerEur = rates.perEur[from];
  const toPerEur = rates.perEur[to];
  if (!fromPerEur || !toPerEur) {
    throw new Error(`ECB reference rate is unavailable for ${from} or ${to}`);
  }
  return toPerEur / fromPerEur;
};
