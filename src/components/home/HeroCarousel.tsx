"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { HeroReveal } from "./HeroReveal";

export interface HeroSlide {
  id: string;
  /** Short name for the dot button / screen readers, e.g. "Anniversary offers". */
  label: string;
  /** Full-bleed background layer (image, colour, decoration). */
  media: React.ReactNode;
  /** Foreground copy and buttons; animated in each time the slide becomes active. */
  content: React.ReactNode;
}

const INTERVAL_MS = 3000;

/**
 * Accessible auto-advancing hero carousel (WAI-ARIA carousel pattern):
 * - advances every 3 s; pauses on hover, keyboard focus, when the tab is hidden, or via the
 *   pause button (WCAG 2.2.2), and never autoplays for prefers-reduced-motion users
 * - previous/next buttons, slide picker dots with progress, arrow keys and touch swipe
 * - inactive slides are `inert` + aria-hidden; all slides share one grid cell (no layout shift)
 */
export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const count = slides.length;
  const [active, setActive] = useState(0);
  // "auto" follows the reduced-motion preference; the play/pause button sets an explicit choice.
  const [preference, setPreference] = useState<"auto" | "playing" | "paused">("auto");
  const [hoverPaused, setHoverPaused] = useState(false);
  const [focusPaused, setFocusPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hidden, setHidden] = useState(false);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    const onVis = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      mq.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const running = preference === "playing" || (preference === "auto" && !reducedMotion);
  const playing = count > 1 && running && !hoverPaused && !focusPaused && !hidden;

  const go = useCallback((i: number) => setActive(((i % count) + count) % count), [count]);

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => go(active + 1), INTERVAL_MS);
    return () => clearTimeout(t);
  }, [playing, active, go]);

  if (!count) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured promotions"
      className="on-dark relative isolate overflow-hidden bg-ink-strong text-white"
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
      onFocus={() => setFocusPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocusPaused(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(active + 1);
        if (e.key === "ArrowLeft") go(active - 1);
      }}
      onTouchStart={(e) => (touchX.current = e.touches[0]?.clientX ?? null)}
      onTouchEnd={(e) => {
        const start = touchX.current;
        const end = e.changedTouches[0]?.clientX;
        touchX.current = null;
        if (start === null || end === undefined || Math.abs(end - start) < 40) return;
        go(end < start ? active + 1 : active - 1);
      }}
    >
      {/* Slides: stacked in one grid cell so the tallest slide sets the height. */}
      <div className="grid grid-cols-[minmax(0,1fr)]" aria-live={playing ? "off" : "polite"}>
        {slides.map((s, i) => {
          const isActive = i === active;
          return (
            <div
              key={s.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}: ${s.label}`}
              aria-hidden={!isActive}
              inert={!isActive}
              className={cn(
                "relative isolate col-start-1 row-start-1 min-w-0 transition-opacity duration-700 ease-out",
                isActive ? "z-10 opacity-100" : "z-0 opacity-0",
              )}
            >
              <div className="absolute inset-0 -z-10">{s.media}</div>
              <div className="container-site flex min-h-[34rem] items-end pb-24 pt-20 md:min-h-[38rem] md:items-center md:pb-20 xl:min-h-[42rem]">
                {/* Re-mount on activation so the entrance animation replays. */}
                <HeroReveal key={isActive ? `on-${s.id}` : `off-${s.id}`} className="w-full min-w-0" animate={isActive}>
                  {s.content}
                </HeroReveal>
              </div>
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <div className="absolute inset-x-0 bottom-0 z-20">
          <div className="container-site flex items-center justify-between gap-4 pb-5">
            <div className="flex items-center gap-2" role="group" aria-label="Choose slide">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Show slide ${i + 1}: ${s.label}`}
                  aria-current={i === active ? "true" : undefined}
                  className="group flex h-8 items-center"
                >
                  <span className="relative block h-1 w-8 overflow-hidden rounded-full bg-white/35 transition-[width] group-hover:bg-white/60 sm:w-12">
                    {i === active && (
                      <span
                        key={`${active}-${playing}`}
                        className="absolute inset-y-0 left-0 rounded-full bg-white"
                        style={
                          playing
                            ? { animation: `hero-progress ${INTERVAL_MS}ms linear forwards` }
                            : { width: "100%" }
                        }
                      />
                    )}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPreference(running ? "paused" : "playing")}
                aria-label={running ? "Pause slideshow" : "Play slideshow"}
                className="flex size-10 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50"
              >
                {running ? <Pause aria-hidden className="size-4" /> : <Play aria-hidden className="size-4" />}
              </button>
              <button
                type="button"
                onClick={() => go(active - 1)}
                aria-label="Previous slide"
                className="flex size-10 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50"
              >
                <ChevronLeft aria-hidden className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => go(active + 1)}
                aria-label="Next slide"
                className="flex size-10 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50"
              >
                <ChevronRight aria-hidden className="size-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
