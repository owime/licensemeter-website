import { describe, expect, it } from "vitest";
import { connectorStatus } from "./workspaceConnectors";

describe("connector catalog status", () => {
  it("never presents demo data as a real connection", () => {
    expect(connectorStatus({ demo: true, connected: true, failed: true })).toBe(
      "demo",
    );
    expect(connectorStatus({ demo: true, connected: false })).toBe("demo");
  });
  it("distinguishes imports, API connections, missing connections and failures", () => {
    expect(connectorStatus({ demo: false, connected: false })).toBe(
      "available",
    );
    expect(connectorStatus({ demo: false, connected: true })).toBe("connected");
    expect(
      connectorStatus({ demo: false, connected: true, imported: true }),
    ).toBe("imported");
    expect(
      connectorStatus({ demo: false, connected: true, failed: true }),
    ).toBe("attention");
  });
});
