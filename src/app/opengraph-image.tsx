import { ImageResponse } from "next/og";

import { DEMO_FIGURES, demoEuros } from "~/lib/demoFigures";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt =
  "LicenseMeter — they left the company, their licenses didn't";

/* Brand mark (see src/components/BrandMark.tsx) as a data URI — satori
 * renders raster/SVG images more reliably than inline SVG elements. */
const MARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><g fill="#1c1a16"><rect x="6" y="6.5" width="4.5" height="19"/><rect x="13.75" y="6.5" width="4.5" height="19"/><rect x="21.5" y="6.5" width="4.5" height="19"/></g><line x1="3.5" y1="22.5" x2="28.5" y2="9.5" stroke="#bc3e12" stroke-width="4.5"/></svg>`;
const MARK_SRC = `data:image/svg+xml,${encodeURIComponent(MARK_SVG)}`;

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#faf8f3",
          padding: "72px 80px",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            fontSize: 44,
            color: "#1c1a16",
          }}
        >
          <img src={MARK_SRC} width={46} height={46} alt="" />
          <div style={{ display: "flex" }}>
            License
            <span style={{ color: "#a8330d" }}>Meter</span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          <div
            style={{
              fontSize: 76,
              lineHeight: 1.05,
              color: "#1c1a16",
              letterSpacing: "-2px",
              maxWidth: 980,
            }}
          >
            They left the company. Their licenses didn&apos;t.
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 30,
              color: "#6b665d",
              fontFamily: "sans-serif",
            }}
          >
            Microsoft 365, Adobe, Zoom, Atlassian and Salesforce seats, priced
            monthly. Read-only. EU-hosted.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid #d2ccbb",
            paddingTop: 28,
            fontSize: 26,
            fontFamily: "sans-serif",
            color: "#a8330d",
          }}
        >
          <span>
            Waste ledger — € {demoEuros(DEMO_FIGURES.monthlyWasteCents)} / month
            recoverable
          </span>
          <span style={{ color: "#75705f" }}>licensemeter</span>
        </div>
      </div>
    ),
    size,
  );
}
