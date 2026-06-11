import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt =
  "LicenseMeter — find the Microsoft 365 licenses you pay for but nobody uses";

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
        <div style={{ display: "flex", fontSize: 44, color: "#1c1a16" }}>
          License
          <span style={{ color: "#a8330d" }}>Meter</span>
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
            Find the licenses you pay for but nobody uses.
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 30,
              color: "#6b665d",
              fontFamily: "sans-serif",
            }}
          >
            Microsoft 365 license waste, priced monthly. Read-only. EU-hosted.
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
          <span>Waste ledger — € 1.833,90 / month recoverable</span>
          <span style={{ color: "#75705f" }}>licensemeter</span>
        </div>
      </div>
    ),
    size,
  );
}
