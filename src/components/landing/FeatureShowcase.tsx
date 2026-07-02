"use client";

import { useEffect, useRef, useState } from "react";

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
 * Landing-page product tour: a feature list on the left, a silent looping
 * demo clip on the right. Only the active clip's <video> is mounted, so the
 * other files are never downloaded. Autoplay is muted and skipped under
 * prefers-reduced-motion (a poster with native controls shows instead), and
 * playback pauses while the panel is offscreen.
 */
export const FeatureShowcase = () => {
  const [active, setActive] = useState(0);
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
  }, [active, reducedMotion]);

  const feature = FEATURES[active] ?? FEATURES[0]!;

  return (
    <div className="grid gap-6 lg:grid-cols-[0.38fr_0.62fr] lg:items-center">
      <div role="tablist" aria-label="Product features" className="flex flex-col gap-3">
        {FEATURES.map((f, index) => {
          const selected = index === active;
          return (
            <button
              key={f.id}
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(index)}
              className={`rounded-2xl border p-5 text-left transition-colors duration-150 ${
                selected
                  ? "border-brand bg-brand-soft/60 shadow-card"
                  : "border-line bg-card hover:border-line-strong"
              }`}
            >
              <span
                className={`font-display block text-base font-semibold tracking-tight ${
                  selected ? "text-brand-deep" : "text-ink"
                }`}
              >
                {f.title}
              </span>
              <span className="text-ink-soft mt-1.5 block text-sm leading-relaxed">
                {f.body}
              </span>
            </button>
          );
        })}
      </div>

      <div
        ref={panelRef}
        className="border-line shadow-hero overflow-hidden rounded-3xl border"
      >
        <video
          ref={videoRef}
          key={feature.id}
          src={feature.video}
          poster={feature.poster}
          muted
          loop
          playsInline
          autoPlay={!reducedMotion}
          controls={reducedMotion}
          preload="metadata"
          aria-label={`Product demo: ${feature.title}`}
          className="block aspect-video w-full bg-white"
        />
      </div>
    </div>
  );
};
