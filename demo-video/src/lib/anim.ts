import { interpolate, spring } from "remotion";

export const EASE_OUT_CUBIC = (t: number) => 1 - Math.pow(1 - t, 3);
export const EASE_IN_OUT = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/** Fade+rise entrance: returns opacity and translateY for a frame window. */
export const enter = (frame: number, start: number, duration = 18, rise = 14) => {
  const p = interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT_CUBIC,
  });
  return { opacity: p, transform: `translateY(${(1 - p) * rise}px)` };
};

/** Plain 0..1 progress over a frame window, clamped, eased. */
export const prog = (
  frame: number,
  start: number,
  duration: number,
  easing: (t: number) => number = EASE_OUT_CUBIC,
) =>
  interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

/** Springy pop-in scale for badges and checkmarks. */
export const pop = (frame: number, fps: number, start: number) =>
  spring({ frame: frame - start, fps, config: { damping: 14, mass: 0.6, stiffness: 160 } });
