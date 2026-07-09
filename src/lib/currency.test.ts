import { describe, expect, it } from "vitest";

import {
  convertCents,
  convertEurCents,
  isSupportedCurrency,
  normalizeCurrencyCents,
} from "./currency";

describe("dashboard currencies", () => {
  it("accepts configured currencies and rejects arbitrary ISO codes", () => {
    expect(isSupportedCurrency("EUR")).toBe(true);
    expect(isSupportedCurrency("SEK")).toBe(true);
    expect(isSupportedCurrency("JPY")).toBe(false);
  });

  it("converts cents with one destination rounding step", () => {
    expect(convertCents(2_420, 1.1435)).toBe(2_767);
    expect(convertCents(1, 0.5)).toBe(1);
    expect(convertEurCents(3_670, 1_143_500)).toBe(4_197);
  });

  it("refuses invalid amounts and rates", () => {
    expect(() => convertCents(-1, 1)).toThrow("non-negative");
    expect(() => convertCents(100, 0)).toThrow("positive");
  });

  it("normalizes native amounts through persisted EUR rates", () => {
    expect(normalizeCurrencyCents(10_000, 1_200_000, 900_000)).toBe(7_500);
  });
});
