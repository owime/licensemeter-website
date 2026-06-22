import { renderToBuffer } from "@react-pdf/renderer";

import { dpaFilename, type DpaLang } from "~/lib/dpa";
import { DpaDocument } from "~/server/dpa/DpaDocument";

/**
 * Renders the pre-signed DPA / AVV to a PDF buffer for the given language.
 * Pure content (no DB), so it is safe to call from the public export route.
 */
export const renderDpaPdf = async (
  lang: DpaLang,
): Promise<{ buffer: Buffer; filename: string }> => {
  const buffer = await renderToBuffer(DpaDocument({ lang }));
  return { buffer, filename: dpaFilename(lang) };
};
