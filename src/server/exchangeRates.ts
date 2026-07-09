import "server-only";

import {
  parseEcbReferenceRates,
  type EcbReferenceRates,
} from "~/lib/exchangeRates";

const ECB_DAILY_RATES_URL =
  "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml";

export const fetchEcbReferenceRates = async (): Promise<EcbReferenceRates> => {
  const response = await fetch(ECB_DAILY_RATES_URL, {
    headers: { Accept: "application/xml, text/xml" },
    next: { revalidate: 12 * 60 * 60 },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) {
    throw new Error(`ECB reference-rate request failed (${response.status})`);
  }
  return parseEcbReferenceRates(await response.text());
};
