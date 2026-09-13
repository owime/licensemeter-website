"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Pointer-driven decoration, kept separate from the server-rendered hero. */
export function OrbitMotion({ children }: { children: ReactNode }) {
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    const hero = scene?.closest("section");
    if (!scene || !hero) return;

    const motion = window.matchMedia(
      "(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)",
    );
    const events = new AbortController();
    const options = { signal: events.signal, passive: true };
    let visible = false;
    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;

    const enabled = () =>
      motion.matches && visible && document.visibilityState === "visible";

    function reset() {
      cancelAnimationFrame(frame);
      frame = 0;
      scene!.style.removeProperty("--orbit-x");
      scene!.style.removeProperty("--orbit-y");
      scene!.style.removeProperty("--orbit-tilt");
    }

    function sync() {
      if (!enabled()) reset();
    }

    const observer = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
      sync();
    });
    observer.observe(hero);

    hero.addEventListener(
      "pointermove",
      (event) => {
        if (!enabled() || event.pointerType !== "mouse") return;
        pointerX = event.clientX;
        pointerY = event.clientY;
        if (frame) return;
        frame = requestAnimationFrame(() => {
          frame = 0;
          if (!enabled()) return;
          const bounds = hero.getBoundingClientRect();
          if (!bounds.width || !bounds.height) return;
          const x = Math.max(
            -1,
            Math.min(1, ((pointerX - bounds.left) / bounds.width) * 2 - 1),
          );
          const y = Math.max(
            -1,
            Math.min(1, ((pointerY - bounds.top) / bounds.height) * 2 - 1),
          );
          scene.style.setProperty("--orbit-x", `${x * 22}px`);
          scene.style.setProperty("--orbit-y", `${y * 16}px`);
          scene.style.setProperty("--orbit-tilt", `${x * 5}deg`);
        });
      },
      options,
    );
    hero.addEventListener("pointerleave", reset, options);
    hero.addEventListener("pointercancel", reset, options);
    window.addEventListener("blur", reset, options);
    document.addEventListener("visibilitychange", sync, options);
    motion.addEventListener("change", sync, options);

    return () => {
      events.abort();
      observer.disconnect();
      reset();
    };
  }, []);

  return (
    <div ref={sceneRef} className="orbit-scene" aria-hidden="true">
      {children}
    </div>
  );
}
