import { parseCsv } from "~/server/graph/reportCsv";

/** One successfully parsed bulk-import line. */
export type ParsedPriceRow = { key: string; cents: number };

export type ParsedPrices = {
  rows: ParsedPriceRow[];
  /** Raw lines with no key, no price, or an unparseable price. */
  invalid: string[];
};

/**
 * "14.90" or German "14,90" to integer cents; null when malformed or out of
 * range. Same 0..100000 bounds as the single-SKU updatePrice action.
 */
export const parsePriceValue = (raw: string): number | null => {
  const value = raw.trim();
  if (!/^\d{1,6}([.,]\d{1,2})?$/.test(value)) return null;
  const parsed = Number.parseFloat(value.replace(",", "."));
  if (!Number.isFinite(parsed) || parsed > 100_000) return null;
  return Math.round(parsed * 100);
};

/**
 * A German decimal price typed as "key,14,90" splits into extra cells at the
 * comma delimiter. When the last two cells look like the two halves of such a
 * decimal, rejoin them; product names never match (they are not bare digits).
 */
const germanDecimal = (cells: string[]): string | null => {
  if (cells.length < 3) return null;
  const whole = cells[cells.length - 2]!.trim();
  const frac = cells[cells.length - 1]!.trim();
  return /^\d{1,6}$/.test(whole) && /^\d{1,2}$/.test(frac)
    ? `${whole}.${frac}`
    : null;
};

/**
 * Parses pasted price-book lines into { key, cents } rows.
 *
 * Accepted shapes per line (key first, price last):
 * - "key,price" with price as "14.90", "14,90" or "15"
 * - the price-book export format "key,display_name,price", so an edited
 *   export round-trips, quoted names with embedded commas included
 * - semicolon- or tab-separated lines (German Excel CSV / spreadsheet paste)
 *
 * Header rows (first cell "key") and blank lines are dropped; anything else
 * that yields no key or no parseable price lands in `invalid`. Key existence
 * is NOT checked here: the server action resolves keys against the tenant.
 */
export const parsePrices = (text: string): ParsedPrices => {
  const rows: ParsedPriceRow[] = [];
  const invalid: string[] = [];
  for (const cells of parseCsv(text.replace(/[;\t]/g, ","))) {
    const key = (cells[0] ?? "").trim();
    const price = germanDecimal(cells) ?? cells[cells.length - 1] ?? "";
    const cents = cells.length >= 2 ? parsePriceValue(price) : null;
    if (key === "" || cents === null) {
      // A priceless "key" first cell is the export header row, not an error.
      if (key.toLowerCase() !== "key") invalid.push(cells.join(",").trim());
      continue;
    }
    rows.push({ key, cents });
  }
  return { rows, invalid };
};
