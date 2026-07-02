import React from "react";

export type Series = {
  points: number[];
  color: string;
  /** Optional soft area fill under the line. */
  fill?: string;
  width?: number;
};

/**
 * Minimal SVG line chart with a draw-on animation: `progress` 0..1 reveals
 * the lines left to right. Series share one y-scale starting at 0.
 */
export const LineChart: React.FC<{
  series: Series[];
  width: number;
  height: number;
  progress: number;
}> = ({ series, width, height, progress }) => {
  const max = Math.max(...series.flatMap((s) => s.points)) * 1.15;
  const toPath = (pts: number[]) =>
    pts
      .map((v, i) => {
        const x = (i / (pts.length - 1)) * width;
        const y = height - (v / max) * height;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

  return (
    <svg width={width} height={height} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <clipPath id="reveal">
          <rect x={0} y={-8} width={width * progress} height={height + 16} />
        </clipPath>
      </defs>
      <g clipPath="url(#reveal)">
        {series.map((s, i) => (
          <React.Fragment key={i}>
            {s.fill && (
              <path
                d={`${toPath(s.points)} L${width},${height} L0,${height} Z`}
                fill={s.fill}
              />
            )}
            <path
              d={toPath(s.points)}
              fill="none"
              stroke={s.color}
              strokeWidth={s.width ?? 3}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </React.Fragment>
        ))}
      </g>
    </svg>
  );
};

/** Deterministic wavy series for demo charts (no randomness). */
export const wave = (
  n: number,
  base: number,
  amp: number,
  drift = 0,
  phase = 0,
) =>
  Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    return (
      base +
      drift * t +
      amp * Math.sin(phase + t * 9.4) +
      amp * 0.55 * Math.sin(phase * 1.7 + t * 23.1)
    );
  });
