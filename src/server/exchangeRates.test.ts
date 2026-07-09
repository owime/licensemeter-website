import { describe, expect, it } from "vitest";

import { parseEcbReferenceRates, rateBetween } from "~/lib/exchangeRates";

const XML = `<?xml version="1.0" encoding="UTF-8"?>
<gesmes:Envelope>
  <Cube>
    <Cube time='2026-07-09'>
      <Cube currency='USD' rate='1.1435'/>
      <Cube currency='GBP' rate='0.85363'/>
      <Cube currency='CHF' rate='0.9227'/>
    </Cube>
  </Cube>
</gesmes:Envelope>`;

describe("ECB reference rates", () => {
  it("parses the publication date and rates quoted against EUR", () => {
    expect(parseEcbReferenceRates(XML)).toEqual({
      asOf: "2026-07-09",
      perEur: { EUR: 1, USD: 1.1435, GBP: 0.85363, CHF: 0.9227 },
    });
  });

  it("derives direct and cross-currency rates", () => {
    const rates = parseEcbReferenceRates(XML);
    expect(rateBetween(rates, "EUR", "USD")).toBe(1.1435);
    expect(rateBetween(rates, "USD", "GBP")).toBeCloseTo(0.85363 / 1.1435);
  });

  it("rejects malformed or unavailable rates", () => {
    expect(() => parseEcbReferenceRates("<xml />")).toThrow("date is missing");
    expect(() =>
      rateBetween(parseEcbReferenceRates(XML), "EUR", "CAD"),
    ).toThrow("unavailable");
  });
});
