import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { rateLimitDurable } from "~/server/rateLimit";
vi.mock("~/server/rateLimit", () => ({
  rateLimitDurable: vi.fn(),
  clientIp: () => "test-ip",
}));
import { POST } from "./route";
const origin = "https://licensemeter.com";
const payload = {
  name: "Visitor",
  email: "visitor@example.com",
  subject: "Help",
  message: "My export failed",
  website: "",
  token: "challenge-token",
  requestId: "36da2bfe-e342-42ea-b856-1f2868b13ec4",
};
const request = (data: unknown = payload, source = origin, host = origin) =>
  new Request(`${host}/api/support`, {
    method: "POST",
    headers: { origin: source, "content-type": "application/json" },
    body: JSON.stringify(data),
  });
const fetchMock = vi.fn();
const verified = () =>
  Response.json({
    success: true,
    hostname: "licensemeter.com",
    action: "support",
  });
beforeEach(() => {
  vi.mocked(rateLimitDurable).mockResolvedValue(true);
  vi.stubEnv("EMAIL_FROM", "LicenseMeter <support@licensemeter.com>");
  vi.stubEnv("RESEND_API_KEY", "test-key");
  vi.stubEnv("SUPPORT_FROM_EMAIL", "Support <support@ugurlabs.com>");
  vi.stubEnv("SUPPORT_TURNSTILE_SECRET_KEY", "test-secret");
  vi.stubEnv("SUPPORT_TURNSTILE_SITE_KEY", "test-site");
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  fetchMock.mockReset();
  vi.mocked(rateLimitDurable).mockReset();
});
describe("support submissions", () => {
  it("sends only after verification with a fixed recipient and visitor Reply-To", async () => {
    fetchMock
      .mockResolvedValueOnce(verified())
      .mockResolvedValueOnce(Response.json({ id: "email-id" }));
    const response = await POST(request());
    expect(await response.json()).toEqual({ success: true });
    const options = fetchMock.mock.calls[1]![1] as RequestInit;
    expect(JSON.parse(options.body as string)).toMatchObject({
      to: ["support@ugurlabs.com"],
      reply_to: payload.email,
      from: "Support <support@ugurlabs.com>",
    });
  });
  it.each([
    { website: "spam" },
    { email: "invalid" },
    { subject: "Hi\r\nBcc: bad@example.com" },
    { message: " " },
    { token: "" },
  ])(
    "rejects invalid input %j without contacting providers",
    async (invalid) => {
      expect((await POST(request({ ...payload, ...invalid }))).status).toBe(
        400,
      );
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );
  it("rejects cross-origin requests", async () => {
    expect((await POST(request(payload, "https://evil.example"))).status).toBe(
      403,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("fails closed when configuration is missing", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    expect((await POST(request())).status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("bounds request bodies even without Content-Length", async () => {
    expect(
      (await POST(request({ ...payload, message: "x".repeat(66000) }))).status,
    ).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it.each([
    { success: false },
    { success: true, hostname: "evil.example", action: "support" },
    { success: true, hostname: "licensemeter.com", action: "login" },
  ])(
    "rejects failed, replayed, or mismatched verification %j",
    async (verdict) => {
      fetchMock.mockResolvedValueOnce(Response.json(verdict));
      expect((await POST(request())).status).toBe(400);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    },
  );
  it.each([
    Response.json({ error: "rejected" }, { status: 429 }),
    Response.json({}),
  ])("does not claim success without Resend acceptance", async (result) => {
    fetchMock.mockResolvedValueOnce(verified()).mockResolvedValueOnce(result);
    const response = await POST(request());
    expect(response.status).toBe(502);
    expect(await response.json()).not.toHaveProperty("success");
  });
  it("uses the existing email sender without requiring Turnstile", async () => {
    vi.stubEnv("SUPPORT_FROM_EMAIL", "");
    vi.stubEnv("SUPPORT_TURNSTILE_SITE_KEY", "");
    vi.stubEnv("SUPPORT_TURNSTILE_SECRET_KEY", "");
    fetchMock.mockResolvedValueOnce(Response.json({ id: "email-id" }));
    expect((await POST(request({ ...payload, token: "" }))).status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(
      JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string),
    ).toMatchObject({
      from: "LicenseMeter <support@licensemeter.com>",
      reply_to: payload.email,
    });
    expect(
      vi
        .mocked(rateLimitDurable)
        .mock.calls.every((call) => call[3] === "deny"),
    ).toBe(true);
  });
  it("blocks email delivery when a submission limit is reached", async () => {
    vi.mocked(rateLimitDurable).mockResolvedValue(false);
    expect((await POST(request())).status).toBe(429);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("requires both Turnstile settings if either is enabled", async () => {
    vi.stubEnv("SUPPORT_TURNSTILE_SECRET_KEY", "");
    expect((await POST(request())).status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("handles provider timeouts without exposing internals", async () => {
    fetchMock.mockRejectedValueOnce(new Error("secret provider details"));
    const response = await POST(request());
    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain("secret provider details");
  });
});
