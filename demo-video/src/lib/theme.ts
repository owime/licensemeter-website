/**
 * Design tokens mirrored from the website's src/styles/globals.css so the
 * video is pixel-faithful to the product. Keep in sync manually.
 */
export const C = {
  canvas: "#fbfcfc",
  card: "#ffffff",
  subtle: "#f3f6f5",
  ink: "#0c1a17",
  inkSoft: "#3a4541",
  inkFaint: "#5c6b67",
  line: "#e4eae8",
  lineStrong: "#d0d9d6",

  brand: "#0d9488",
  brandStrong: "#115e59",
  brandText: "#0f766e",
  brandDeep: "#134e4a",
  brandSoft: "#e6f7f4",
  brandBright: "#2dd4bf",

  waste: "#f59e0b",
  wasteText: "#b45309",
  wasteDeep: "#854f0b",
  wasteSoft: "#fef3e2",

  good: "#10b981",
  goodText: "#047857",
  goodSoft: "#e7f7f0",

  danger: "#dc2626",
  dangerText: "#b91c1c",
  dangerSoft: "#fdecec",

  sidebar: "#0c1a17",
  sidebarLine: "#20302c",
  sidebarSoft: "#b8c4c0",

  gold: "#a16207",
  goldSoft: "#fbf0d4",
  slateInk: "#475569",
  slateSoft: "#eef1f6",
} as const;

export const SHADOW = {
  card: "0 2px 8px -2px rgba(12, 26, 23, 0.08)",
  float: "0 10px 28px -10px rgba(12, 26, 23, 0.14)",
  hero: "0 24px 56px -18px rgba(12, 26, 23, 0.22)",
} as const;

export const FONT = {
  sans: "Geist, ui-sans-serif, system-ui, sans-serif",
  mono: "'Geist Mono', ui-monospace, 'SF Mono', monospace",
} as const;
