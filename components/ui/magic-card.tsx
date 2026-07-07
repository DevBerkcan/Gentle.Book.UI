"use client";

import { useCallback, useEffect, useRef } from "react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

interface MagicCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  gradientColor?: string;
  gradientOpacity?: number;
  gradientSize?: number;
}

export function MagicCard({
  children,
  className,
  gradientColor = "#6355E4",
  gradientOpacity = 0.15,
  gradientSize = 200,
  ...props
}: MagicCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(-gradientSize);
  const mouseY = useMotionValue(-gradientSize);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!ref.current) return;
      const { left, top } = ref.current.getBoundingClientRect();
      mouseX.set(e.clientX - left);
      mouseY.set(e.clientY - top);
    },
    [mouseX, mouseY],
  );

  const handleMouseLeave = useCallback(() => {
    mouseX.set(-gradientSize);
    mouseY.set(-gradientSize);
  }, [mouseX, mouseY, gradientSize]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave]);

  const background = useMotionTemplate`radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px, ${gradientColor}${Math.round(gradientOpacity * 255).toString(16).padStart(2, "0")}, transparent 80%)`;

  return (
    <div ref={ref} className={cn("relative overflow-hidden", className)} {...props}>
      <motion.div
        className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
        style={{ background }}
      />
      {children}
    </div>
  );
}
