import { describe, expect, it } from "vitest";

import { csvToRecords, parseCsv, reportDate } from "./reportCsv";

describe("parseCsv", () => {
  it("parses simple rows", () => {
    expect(parseCsv("a,b,c\n1,2,3")).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
  });

  it("handles quoted fields containing commas and newlines", () => {
    const text = 'name,note\n"Doe, Jane","line1\nline2"';
    expect(parseCsv(text)).toEqual([
      ["name", "note"],
      ["Doe, Jane", "line1\nline2"],
    ]);
  });

  it("handles escaped quotes", () => {
    expect(parseCsv('a\n"say ""hi"""')).toEqual([["a"], ['say "hi"']]);
  });

  it("handles CRLF and a UTF-8 BOM", () => {
    expect(parseCsv("﻿a,b\r\n1,2\r\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("drops empty trailing rows", () => {
    expect(parseCsv("a,b\n1,2\n\n  ,\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
});

describe("csvToRecords", () => {
  it("keys rows by header and fills missing cells", () => {
    const records = csvToRecords("A,B,C\n1,2\n");
    expect(records).toEqual([{ A: "1", B: "2", C: "" }]);
  });

  it("returns empty array for empty input", () => {
    expect(csvToRecords("")).toEqual([]);
  });
});

describe("reportDate", () => {
  it("normalizes empty strings to null", () => {
    expect(reportDate("")).toBeNull();
    expect(reportDate("  ")).toBeNull();
    expect(reportDate(undefined)).toBeNull();
    expect(reportDate("2026-05-01")).toBe("2026-05-01");
  });
});
