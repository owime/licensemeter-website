/** Use the configured public origin behind a self-hosted reverse proxy. */
export function requestBaseUrl(request: Request): string {
  if (process.env.SELF_HOSTED !== "true") return request.url;
  const baseUrl = process.env.APP_BASE_URL;
  if (!baseUrl) throw new Error("APP_BASE_URL is required for self-hosting");
  return new URL(baseUrl).origin;
}
