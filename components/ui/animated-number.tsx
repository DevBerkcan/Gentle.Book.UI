"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  className?: string;
  formatFn?: (n: number) => string;
}

export function AnimatedNumber({
  value,
  duration = 1.2,
  className,
  formatFn,
}: AnimatedNumberProps) {
  const [displayed, setDisplayed] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    // Found during live pre-launch testing: this used to gate the animation behind
    // useInView(ref, { once: true }) — on the tracking page, that in-view check never
    // fired, so `displayed` stayed stuck at its initial 0 forever, for every stat on the
    // page (booking counts included, not just currency amounts). The "animate once
    // scrolled into view" nicety isn't worth numbers silently never appearing; just
    // animate on mount instead, still only once per value thanks to hasAnimated.
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    // Rounding to an integer on every animation frame permanently collapsed any value
    // under 0.5 (e.g. a €0.01 test price, or any sub-1 currency amount) to a displayed 0
    // even once the animation finished — Math.round(0.01) is just 0. Only round when
    // there's no formatFn (a plain integer counter, e.g. a booking count); currency/decimal
    // values rely on formatFn (e.g. formatPrice) for correct precision.
    const controls = animate(0, value, {
      duration,
      ease: "easeOut",
      onUpdate: (latest) => setDisplayed(formatFn ? latest : Math.round(latest)),
    });

    return () => controls.stop();
  }, [value, duration]);

  const text = formatFn ? formatFn(displayed) : displayed.toLocaleString("de-DE");

  return (
    <span className={className}>
      {text}
    </span>
  );
}
