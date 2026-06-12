import { describe, expect, it } from "vitest";

import { reportFilename } from "~/server/report/filename";

const NOW = new Date("2026-06-12T12:00:00Z");
const ID = "3f2c8e0a-9d41-4b7a-8c55-2f1e6a7b9c0d";

describe("reportFilename", () => {
  it("slugifies the workspace name and appends the UTC month", () => {
    expect(reportFilename({ name: "Contoso GmbH", id: ID }, NOW)).toBe(
      "licensemeter-report-contoso-gmbh-2026-06.pdf",
    );
  });

  it("strips diacritics and collapses separator runs", () => {
    expect(
      reportFilename({ name: "  Müller & Söhne -- AG  ", id: ID }, NOW),
    ).toBe("licensemeter-report-muller-sohne-ag-2026-06.pdf");
  });

  it("falls back to the tenant id when the name is null or yields no slug", () => {
    expect(reportFilename({ name: null, id: ID }, NOW)).toBe(
      `licensemeter-report-${ID}-2026-06.pdf`,
    );
    expect(reportFilename({ name: "株式会社", id: ID }, NOW)).toBe(
      `licensemeter-report-${ID}-2026-06.pdf`,
    );
  });

  it("caps long names without leaving a trailing hyphen", () => {
    const name = "a".repeat(39) + " trailing words beyond the cap";
    const file = reportFilename({ name, id: ID }, NOW);
    expect(file).toBe(`licensemeter-report-${"a".repeat(39)}-2026-06.pdf`);
    expect(file.length).toBeLessThanOrEqual(
      "licensemeter-report-".length + 40 + "-2026-06.pdf".length,
    );
  });

  it("uses the UTC month at a month boundary", () => {
    expect(
      reportFilename(
        { name: "Contoso", id: ID },
        new Date("2026-07-01T00:30:00Z"),
      ),
    ).toBe("licensemeter-report-contoso-2026-07.pdf");
  });
});
