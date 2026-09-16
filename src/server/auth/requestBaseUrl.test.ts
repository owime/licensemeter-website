import { afterEach, describe, expect, it, vi } from "vitest";
import { requestBaseUrl } from "./requestBaseUrl";

afterEach(() => vi.unstubAllEnvs());

describe("requestBaseUrl", () => {
  it("uses the configured public origin instead of the container address or forwarded headers", () => {
    vi.stubEnv("SELF_HOSTED", "true");
    vi.stubEnv("APP_BASE_URL", "https://licenses.example.com");
    const request = new Request("http://0.0.0.0:3000/api/auth/demo", {
      headers: { "x-forwarded-host": "untrusted.example" },
    });
    expect(new URL("/app", requestBaseUrl(request)).href).toBe(
      "https://licenses.example.com/app",
    );
  });

  it("preserves hosted deployment and preview origins", () => {
    vi.stubEnv("SELF_HOSTED", "false");
    vi.stubEnv("APP_BASE_URL", "https://licensemeter.com");
    const request = new Request("https://preview.example/api/auth/demo");
    expect(new URL("/app", requestBaseUrl(request)).href).toBe(
      "https://preview.example/app",
    );
  });

  it("fails closed if a self-hosted origin is missing", () => {
    vi.stubEnv("SELF_HOSTED", "true");
    vi.stubEnv("APP_BASE_URL", "");
    expect(() => requestBaseUrl(new Request("http://localhost"))).toThrow(
      "APP_BASE_URL is required",
    );
  });
});
