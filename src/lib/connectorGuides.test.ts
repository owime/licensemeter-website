import { describe, expect, it } from "vitest";

import { CONNECTOR_GUIDES } from "./connectorGuides";
import { CONNECTORS } from "./connectors";

/* Microsoft is the primary connector and Adobe predates the CONNECTORS spec
 * array; both have guides but intentionally no CONNECTORS entry. */
const GUIDE_ONLY_SLUGS = ["microsoft", "adobe"];

describe("connector / guide parity", () => {
  const guideSlugs = CONNECTOR_GUIDES.map((g) => g.slug);
  const providers = CONNECTORS.map((c) => c.provider);

  it("every SaaS connector has a setup guide", () => {
    for (const c of CONNECTORS) {
      expect(guideSlugs, `missing guide for ${c.provider}`).toContain(
        c.provider,
      );
    }
  });

  it("every guide (except the standalone ones) has a connector spec", () => {
    for (const g of CONNECTOR_GUIDES) {
      if (GUIDE_ONLY_SLUGS.includes(g.slug)) continue;
      expect(providers, `missing connector for guide ${g.slug}`).toContain(
        g.slug,
      );
    }
  });

  it("paired entries agree on label and kind", () => {
    for (const c of CONNECTORS) {
      const guide = CONNECTOR_GUIDES.find((g) => g.slug === c.provider);
      expect(guide?.name).toBe(c.label);
      expect(guide?.kind).toBe(c.kind);
    }
  });

  it("has no duplicate guide slugs", () => {
    expect(new Set(guideSlugs).size).toBe(guideSlugs.length);
  });
});
