import type { DpaLang } from "~/lib/dpa";
import { renderDpaPdf } from "~/server/dpa/renderDpa";

export const maxDuration = 60;

/**
 * Public download of the pre-signed DPA / AVV PDF. Unlike the report export,
 * this is a marketing/legal asset with no personal data, so it is intentionally
 * unauthenticated. `?lang=de` returns the German AVV; anything else the English
 * DPA. Content is static (one version), so it is cacheable.
 */
export const GET = async (req: Request) => {
  const lang: DpaLang =
    new URL(req.url).searchParams.get("lang") === "de" ? "de" : "en";

  const { buffer, filename } = await renderDpaPdf(lang);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
};
