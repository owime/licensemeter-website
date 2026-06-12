import { describe, expect, it } from "vitest";

import { parsePrices, parsePriceValue } from "./parsePrices";

describe("parsePriceValue", () => {
  it("accepts dot decimals", () => {
    expect(parsePriceValue("14.90")).toBe(1490);
  });

  it("accepts German comma decimals", () => {
    expect(parsePriceValue("14,90")).toBe(1490);
    expect(parsePriceValue("14,9")).toBe(1490);
  });

  it("accepts integers and zero", () => {
    expect(parsePriceValue("15")).toBe(1500);
    expect(parsePriceValue("0")).toBe(0);
  });

  it("accepts the 100000 upper bound", () => {
    expect(parsePriceValue("100000")).toBe(10_000_000);
  });

  it("rejects malformed and out-of-range values", () => {
    expect(parsePriceValue("")).toBeNull();
    expect(parsePriceValue("abc")).toBeNull();
    expect(parsePriceValue("-3")).toBeNull();
    expect(parsePriceValue("1.234,56")).toBeNull(); // thousands separator
    expect(parsePriceValue("12.345")).toBeNull(); // three decimal digits
    expect(parsePriceValue("€14,90")).toBeNull();
    expect(parsePriceValue("100000.01")).toBeNull();
  });
});

describe("parsePrices", () => {
  it("parses key,price lines with both decimal styles", () => {
    const { rows, invalid } = parsePrices(
      "ENTERPRISEPACK,12.80\nadobe:Photoshop,23.79\nSPE_E3,31",
    );
    expect(rows).toEqual([
      { key: "ENTERPRISEPACK", cents: 1280 },
      { key: "adobe:Photoshop", cents: 2379 },
      { key: "SPE_E3", cents: 3100 },
    ]);
    expect(invalid).toEqual([]);
  });

  it("rejoins a German decimal split by the comma delimiter", () => {
    const { rows, invalid } = parsePrices("zoom:Licensed,13,99");
    expect(rows).toEqual([{ key: "zoom:Licensed", cents: 1399 }]);
    expect(invalid).toEqual([]);
  });

  it("round-trips the export format, header row included", () => {
    const text =
      "key,display_name,monthly_price (EUR decimal)\r\n" +
      "ENTERPRISEPACK,Office 365 E3,12.80\r\n" +
      'SPE_E5,"Microsoft 365 E5, with Teams",53.70';
    const { rows, invalid } = parsePrices(text);
    expect(rows).toEqual([
      { key: "ENTERPRISEPACK", cents: 1280 },
      { key: "SPE_E5", cents: 5370 },
    ]);
    expect(invalid).toEqual([]);
  });

  it("handles an export row edited to a German decimal", () => {
    const { rows } = parsePrices("ENTERPRISEPACK,Office 365 E3,12,80");
    expect(rows).toEqual([{ key: "ENTERPRISEPACK", cents: 1280 }]);
  });

  it("accepts semicolon- and tab-separated lines", () => {
    const { rows, invalid } = parsePrices(
      "ENTERPRISEPACK;14,90\nSPE_E3\t31.30",
    );
    expect(rows).toEqual([
      { key: "ENTERPRISEPACK", cents: 1490 },
      { key: "SPE_E3", cents: 3130 },
    ]);
    expect(invalid).toEqual([]);
  });

  it("collects unparseable lines without throwing", () => {
    const { rows, invalid } = parsePrices(
      "no-price-here\nSPE_E3,abc\n,12.80\nGOOD_KEY,5.00",
    );
    expect(rows).toEqual([{ key: "GOOD_KEY", cents: 500 }]);
    expect(invalid).toEqual(["no-price-here", "SPE_E3,abc", ",12.80"]);
  });

  it("drops blank lines and returns nothing for empty input", () => {
    expect(parsePrices("")).toEqual({ rows: [], invalid: [] });
    expect(parsePrices("\n\n  \n")).toEqual({ rows: [], invalid: [] });
  });
});
