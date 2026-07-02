import React from "react";
import { C, FONT } from "../lib/theme";

/* The tally-with-strike mark, copied from the website's BrandMark.tsx. */
const PALETTES = {
  light: { bars: "#0c1a17", strike: "#f59e0b" },
  dark: { bars: "#fbfcfc", strike: "#fbbf24" },
} as const;

export const BrandMark: React.FC<{
  size?: number;
  tone?: keyof typeof PALETTES;
}> = ({ size = 22, tone = "light" }) => {
  const palette = PALETTES[tone];
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <g fill={palette.bars}>
        <rect x="6" y="6.5" width="4.5" height="19" />
        <rect x="13.75" y="6.5" width="4.5" height="19" />
        <rect x="21.5" y="6.5" width="4.5" height="19" />
      </g>
      <line
        x1="3.5"
        y1="22.5"
        x2="28.5"
        y2="9.5"
        stroke={palette.strike}
        strokeWidth="4.5"
      />
    </svg>
  );
};

export const Wordmark: React.FC<{
  size?: number;
  tone?: "light" | "dark";
}> = ({ size = 22, tone = "dark" }) => (
  <span
    style={{
      fontFamily: FONT.sans,
      fontWeight: 600,
      fontSize: size,
      letterSpacing: "-0.02em",
      color: tone === "dark" ? C.canvas : C.ink,
    }}
  >
    License
    <span style={{ color: tone === "dark" ? C.brandBright : C.brandText }}>
      Meter
    </span>
  </span>
);
