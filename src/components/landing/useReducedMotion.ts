"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

const subscribe = (onStoreChange: () => void) => {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
};

const getSnapshot = () => window.matchMedia(QUERY).matches;

/**
 * Reactive reduced-motion preference. The server defaults to motion allowed,
 * but landing media never receives a source until it nears the viewport, so a
 * reduced-motion visitor's client preference is known before playback can
 * begin. Runtime preference changes are reflected immediately.
 */
export const useReducedMotion = () =>
  useSyncExternalStore(subscribe, getSnapshot, () => false);
