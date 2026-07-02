import React from "react";
import { interpolate } from "remotion";
import { EASE_IN_OUT } from "./anim";

export type CursorStop = {
  /** Frame at which the cursor arrives at this point. */
  at: number;
  x: number;
  y: number;
  /** If true, play a click pulse on arrival. */
  click?: boolean;
};

/**
 * An animated cursor that glides between stops and pulses on click.
 * Coordinates are in composition pixels.
 */
export const Cursor: React.FC<{ frame: number; stops: CursorStop[] }> = ({
  frame,
  stops,
}) => {
  if (stops.length === 0) return null;
  const times = stops.map((s) => s.at);
  const x = interpolate(frame, times, stops.map((s) => s.x), {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_IN_OUT,
  });
  const y = interpolate(frame, times, stops.map((s) => s.y), {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_IN_OUT,
  });

  // Click pulse: a ring expanding from the cursor for 14 frames after arrival.
  const pulses = stops
    .filter((s) => s.click)
    .map((s) => {
      const p = interpolate(frame, [s.at, s.at + 14], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      return { ...s, p };
    })
    .filter((s) => s.p > 0 && s.p < 1);

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 50 }}>
      {pulses.map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: s.x,
            top: s.y,
            width: 56,
            height: 56,
            marginLeft: -28,
            marginTop: -28,
            borderRadius: "50%",
            border: "2.5px solid rgba(196, 90, 34, 0.7)",
            transform: `scale(${0.25 + s.p * 0.95})`,
            opacity: 1 - s.p,
          }}
        />
      ))}
      <svg
        width={30}
        height={30}
        viewBox="0 0 24 24"
        style={{
          position: "absolute",
          left: x,
          top: y,
          filter: "drop-shadow(0 2px 5px rgba(24, 18, 12, 0.35))",
        }}
      >
        <path
          d="M5.5 3.2 19 11.6l-6.2 1.3-2.6 5.8L5.5 3.2Z"
          fill="#18120c"
          stroke="#fdfaf5"
          strokeWidth={1.4}
        />
      </svg>
    </div>
  );
};
