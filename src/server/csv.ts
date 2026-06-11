/** CSV writer for exports (RFC 4180 quoting). */

const escapeCell = (value: string): string =>
  /[",\n\r]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;

export const toCsv = (rows: (string | number | null | undefined)[][]): string =>
  rows
    .map((row) => row.map((c) => escapeCell(String(c ?? ""))).join(","))
    .join("\r\n");

export const csvResponse = (filename: string, csv: string): Response =>
  new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });

export const centsToDecimal = (cents: number): string => (cents / 100).toFixed(2);
