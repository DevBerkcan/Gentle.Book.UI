"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface GlowingEffectProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  spread?: number;
  blur?: number;
  disabled?: boolean;
}

export function GlowingEffect({
  children,
  className,
  glowColor = "#6355E4",
  spread = 40,
  blur = 0,
  disabled = false,
}: GlowingEffectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || disabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      setPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };

    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseenter", () => setIsHovered(true));
    el.addEventListener("mouseleave", () => setIsHovered(false));

    return () => {
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseenter", () => setIsHovered(true));
      el.removeEventListener("mouseleave", () => setIsHovered(false));
    };
  }, [disabled]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Glow overlay */}
      {!disabled && (
        <div
          className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] transition-opacity duration-300"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(${spread}px circle at ${position.x}px ${position.y}px, ${glowColor}30, transparent 80%)`,
            filter: blur ? `blur(${blur}px)` : undefined,
          }}
        />
      )}
      {/* Animated border glow */}
      <div
        className="pointer-events-none absolute -inset-[1px] z-0 rounded-[inherit] transition-all duration-500"
        style={{
          background: isHovered && !disabled
            ? `linear-gradient(135deg, ${glowColor}66, transparent 50%, ${glowColor}33)`
            : "transparent",
          boxShadow: isHovered && !disabled
            ? `0 0 ${spread / 2}px ${glowColor}40, inset 0 0 ${spread / 4}px ${glowColor}20`
            : "none",
        }}
      />
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
