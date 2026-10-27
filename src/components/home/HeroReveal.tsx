"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";

/** Staggered entrance for hero copy. Skipped entirely when the visitor prefers reduced motion. */
export function HeroReveal({
  children,
  className,
  animate = true,
}: {
  children: React.ReactNode;
  className?: string;
  /** Set false to render without the entrance animation (e.g. hidden carousel slides). */
  animate?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!ref.current || !animate) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(ref.current!.querySelectorAll("[data-reveal]"), {
        y: 28,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.08,
        delay: 0.1,
      });
    });
    return () => mm.revert();
  }, [animate]);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
