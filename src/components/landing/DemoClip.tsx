"use client";

import { Maximize2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { VideoLightbox } from "./VideoLightbox";

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

  const close = () => {
    setExpanded(false);
    const video = videoRef.current;
    if (video && !reducedMotion) void video.play().catch(() => undefined);
  };

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
              <Maximize2 className="size-3.5" aria-hidden="true" />
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
        <VideoLightbox
          open={expanded}
          onClose={close}
          src={src}
          poster={poster}
          label={label}
        />
      )}
    </figure>
  );
};
