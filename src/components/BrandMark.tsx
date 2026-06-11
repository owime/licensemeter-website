/**
 * The LicenseMeter mark: a tally being struck out — count the seats, strike
 * the waste. Colors are brand constants matching --color-ink and --color-rust
 * in globals.css; the favicon set (src/app/icon.svg, scripts/make-icons.mjs)
 * carries the same geometry and must be regenerated if this changes.
 */
export const BrandMark = ({ size = 22 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    aria-hidden="true"
    focusable="false"
  >
    <g fill="#1c1a16">
      <rect x="6" y="6.5" width="4.5" height="19" />
      <rect x="13.75" y="6.5" width="4.5" height="19" />
      <rect x="21.5" y="6.5" width="4.5" height="19" />
    </g>
    <line
      x1="3.5"
      y1="22.5"
      x2="28.5"
      y2="9.5"
      stroke="#bc3e12"
      strokeWidth="4.5"
    />
  </svg>
);
