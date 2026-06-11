/**
 * The LicenseMeter mark: a tally being struck out — count the seats, strike
 * the waste. Colors are brand constants matching the tokens in globals.css;
 * "light" sits on paper surfaces (ink bars, rust strike), "dark" sits on the
 * ink sidebar (paper bars, rust-bright strike — rust reads only 3.3:1 there).
 * The favicon set (src/app/icon.svg, scripts/make-icons.mjs) carries the same
 * geometry in the light palette and must be regenerated if this changes.
 */
const PALETTES = {
  light: { bars: "#1c1a16", strike: "#bc3e12" },
  dark: { bars: "#faf8f3", strike: "#e2683f" },
} as const;

export const BrandMark = ({
  size = 22,
  tone = "light",
}: {
  size?: number;
  tone?: keyof typeof PALETTES;
}) => {
  const palette = PALETTES[tone];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
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
