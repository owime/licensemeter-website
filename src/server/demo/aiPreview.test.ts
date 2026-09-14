import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AI_PREVIEW_PROVIDERS,
  getAiPreview,
  shouldPreviewAi,
} from "./aiPreview";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("AI sample preview isolation", () => {
  it("requires opt-in on an empty real workspace", () => {
    expect(
      shouldPreviewAi({
        isDemo: false,
        requested: false,
        hasConnection: false,
        hasData: false,
      }),
    ).toBe(false);
    expect(
      shouldPreviewAi({
        isDemo: false,
        requested: true,
        hasConnection: false,
        hasData: false,
      }),
    ).toBe(true);
  });
  it("never replaces a real connection or stored data even with a preview URL", () => {
    for (const [hasConnection, hasData] of [
      [true, false],
      [false, true],
      [true, true],
    ] as const) {
      expect(
        shouldPreviewAi({
          isDemo: false,
          requested: true,
          hasConnection,
          hasData,
        }),
      ).toBe(false);
    }
  });
  it("always supplies current fixtures in the public demo", () => {
    expect(
      shouldPreviewAi({
        isDemo: true,
        requested: false,
        hasConnection: false,
        hasData: true,
      }),
    ).toBe(true);
  });
  it.each(AI_PREVIEW_PROVIDERS)(
    "provides %s history and fictional members without network requests",
    async (provider) => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-09-14T12:00:00Z"));
      const fetchSpy = vi.fn(() => {
        throw new Error("Preview must not call an API");
      });
      vi.stubGlobal("fetch", fetchSpy);
      const preview = await getAiPreview(provider);
      expect(new Set(preview.spend.map((r) => r.day)).size).toBe(60);
      expect(preview.spend.at(-1)?.day).toBe("2026-09-14");
      expect(
        preview.spend.every(
          (r) =>
            r.provider === provider &&
            Number.isInteger(r.amountCents) &&
            r.amountCents > 0,
        ),
      ).toBe(true);
      expect(preview.members.length).toBeGreaterThan(0);
      expect(preview.members.every((m) => m.email.endsWith(".example"))).toBe(
        true,
      );
      expect(fetchSpy).not.toHaveBeenCalled();
      vi.setSystemTime(new Date("2027-01-01T12:00:00Z"));
      expect((await getAiPreview(provider)).spend.at(-1)?.day).toBe(
        "2027-01-01",
      );
    },
  );
});
