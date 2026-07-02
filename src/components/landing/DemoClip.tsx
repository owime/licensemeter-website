"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize2, X } from "lucide-react";

/**
 * A single self-playing product demo clip with the same behavior as the
 * landing showcase's video panel: muted looping autoplay that pauses while
 * offscreen or on a hidden browser tab, a poster with native controls under
 * prefers-reduced-motion, and a click-to-enlarge lightbox (backdrop, Escape
 * or the close button dismisses it).
 */
export const DemoClip = ({
  src,
  poster,
  label,
  caption,
  className = "",
}: {
  src: string;
  poster: string;
  /** Accessible description, e.g. "Product demo: connecting Atlassian". */
  label: string;
  /** Optional small print rendered under the clip. */
  caption?: string;
  className?: string;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setReducedMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const panel = panelRef.current;
    if (!video || !panel || reducedMotion) return;
    let inView = false;
    const sync = () => {
      if (inView && document.visibilityState === "visible") {
        void video.play().catch(() => undefined);
      } else {
        video.pause();
      }
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        inView = entry.isIntersecting;
        sync();
      },
      { threshold: 0.35 },
    );
    observer.observe(panel);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [reducedMotion]);

  const close = useCallback(() => {
    setExpanded(false);
    const video = videoRef.current;
    if (video && !reducedMotion) void video.play().catch(() => undefined);
  }, [reducedMotion]);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [expanded, close]);

  const open = () => {
    videoRef.current?.pause();
    setExpanded(true);
  };

  const videoElement = (
    <video
      ref={videoRef}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      autoPlay={!reducedMotion}
      controls={reducedMotion}
      preload="metadata"
      aria-label={label}
      className="block aspect-video w-full bg-white"
    />
  );

  return (
    <figure className={className}>
      <div
        ref={panelRef}
        className="border-line shadow-float group relative overflow-hidden rounded-2xl border"
      >
        {reducedMotion ? (
          videoElement
        ) : (
          <button
            type="button"
            onClick={open}
            aria-haspopup="dialog"
            aria-label={`Enlarge: ${label}`}
            className="block w-full cursor-zoom-in"
          >
            {videoElement}
            <span className="bg-ink/70 text-canvas pointer-events-none absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium opacity-0 transition-opacity duration-150 group-hover:opacity-100">
              <Maximize2 className="size-3.5" />
              Enlarge
            </span>
          </button>
        )}
      </div>
      {caption && (
        <figcaption className="text-ink-faint mt-2 text-xs leading-relaxed">
          {caption}
        </figcaption>
      )}

      {expanded && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={label}
          onClick={close}
          className="bg-ink/80 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm sm:p-10"
        >
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="text-canvas/80 hover:text-canvas absolute top-4 right-4 cursor-pointer p-2"
          >
            <X className="size-6" />
          </button>
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-6xl"
          >
            <video
              src={src}
              poster={poster}
              muted
              loop
              playsInline
              autoPlay
              preload="auto"
              aria-label={label}
              className="shadow-hero block aspect-video w-full rounded-2xl bg-white"
            />
          </div>
        </div>
      )}
    </figure>
  );
};
