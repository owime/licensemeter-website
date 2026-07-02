"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize2, X } from "lucide-react";

type Feature = {
  id: string;
  title: string;
  body: string;
  video: string;
  poster: string;
};

const FEATURES: Feature[] = [
  {
    id: "overview",
    title: "See the waste in euros",
    body: "The overview prices every unused seat and tracks spend against waste over time.",
    video: "/videos/feature-overview.mp4",
    poster: "/videos/feature-overview.jpg",
  },
  {
    id: "findings",
    title: "Act on findings in bulk",
    body: "Filter by rule, select the seats that leaked, and acknowledge them in one click.",
    video: "/videos/feature-findings.mp4",
    poster: "/videos/feature-findings.jpg",
  },
  {
    id: "ai-costs",
    title: "Track AI spend daily",
    body: "OpenAI and Anthropic API costs side by side, shown as billed.",
    video: "/videos/feature-ai-costs.mp4",
    poster: "/videos/feature-ai-costs.jpg",
  },
  {
    id: "connectors",
    title: "Connect a tool in minutes",
    body: "Read-only connectors for Microsoft 365, Adobe, Atlassian, Zoom and more.",
    video: "/videos/feature-connectors.mp4",
    poster: "/videos/feature-connectors.jpg",
  },
];

/**
 * Landing-page product tour. Desktop: a slim feature rail on the left, a
 * large demo clip on the right; clicking the clip opens it in a lightbox
 * (backdrop or Escape closes). Mobile: a horizontal chip row with the video
 * below it. Only the active clip's <video> is mounted, autoplay is muted and
 * skipped under prefers-reduced-motion (poster with native controls shows
 * instead), and playback pauses while offscreen or on a hidden browser tab.
 */
export const FeatureShowcase = () => {
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  /* Rotate through the features until the visitor interacts; a manual tab
   * click or opening the lightbox hands over control for good. */
  const [autoAdvance, setAutoAdvance] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);

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
  }, [active, reducedMotion]);

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
    setAutoAdvance(false);
    videoRef.current?.pause();
    setExpanded(true);
  };

  /* Drive the progress bar on the active tab from playback time. Direct DOM
   * writes on rAF keep it smooth without re-rendering per frame. */
  useEffect(() => {
    if (!autoAdvance || reducedMotion) return;
    let rafId: number;
    const tick = () => {
      const video = videoRef.current;
      const bar = progressRef.current;
      if (video && bar && Number.isFinite(video.duration) && video.duration > 0) {
        bar.style.width = `${(video.currentTime / video.duration) * 100}%`;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [active, autoAdvance, reducedMotion]);

  const feature = FEATURES[active] ?? FEATURES[0]!;

  const videoElement = (
    <video
      ref={videoRef}
      key={feature.id}
      src={feature.video}
      poster={feature.poster}
      muted
      loop={!autoAdvance || reducedMotion}
      playsInline
      autoPlay={!reducedMotion}
      controls={reducedMotion}
      preload="metadata"
      onEnded={
        autoAdvance && !reducedMotion
          ? () => setActive((current) => (current + 1) % FEATURES.length)
          : undefined
      }
      aria-label={`Product demo: ${feature.title}`}
      className="block aspect-video w-full bg-white"
    />
  );

  return (
    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[280px_1fr] lg:items-center lg:gap-6">
      {/* Mobile: horizontal chip row. Desktop: vertical rail with descriptions. */}
      <div
        role="tablist"
        aria-label="Product features"
        className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:mx-0 lg:flex-col lg:gap-3 lg:overflow-visible lg:px-0 lg:pb-0"
      >
        {FEATURES.map((f, index) => {
          const selected = index === active;
          return (
            <button
              key={f.id}
              role="tab"
              aria-selected={selected}
              onClick={() => {
                setAutoAdvance(false);
                setActive(index);
              }}
              className={`relative shrink-0 cursor-pointer overflow-hidden rounded-full border px-4 py-2 text-left text-sm font-medium whitespace-nowrap transition-colors duration-150 lg:shrink lg:rounded-2xl lg:px-4 lg:py-3.5 lg:whitespace-normal ${
                selected
                  ? "border-brand bg-brand-soft/60 text-brand-deep shadow-card"
                  : "border-line bg-card text-ink hover:border-line-strong"
              }`}
            >
              <span className="font-display block text-sm font-semibold tracking-tight">
                {f.title}
              </span>
              <span className="text-ink-soft mt-1 hidden text-[13px] leading-snug font-normal lg:block">
                {f.body}
              </span>
              {autoAdvance && selected && !reducedMotion && (
                <span
                  aria-hidden="true"
                  className="bg-brand/15 absolute inset-x-0 bottom-0 block h-0.5"
                >
                  <span
                    ref={progressRef}
                    className="bg-brand block h-full"
                    style={{ width: "0%" }}
                  />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div>
        <div
          ref={panelRef}
          className="border-line shadow-hero group relative overflow-hidden rounded-2xl border lg:rounded-3xl"
        >
          {reducedMotion ? (
            videoElement
          ) : (
            <button
              type="button"
              onClick={open}
              aria-haspopup="dialog"
              aria-label={`Enlarge demo: ${feature.title}`}
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
        <p className="text-ink-soft mt-3 text-sm leading-relaxed lg:hidden">
          {feature.body}
        </p>
      </div>

      {expanded && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Product demo: ${feature.title}`}
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
              src={feature.video}
              poster={feature.poster}
              muted
              loop
              playsInline
              autoPlay
              preload="auto"
              aria-label={`Product demo: ${feature.title}`}
              className="shadow-hero block aspect-video w-full rounded-2xl bg-white"
            />
          </div>
        </div>
      )}
    </div>
  );
};
