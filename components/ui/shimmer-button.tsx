"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
  children: React.ReactNode;
  className?: string;
}

export function ShimmerButton({
  shimmerColor = "rgba(255,255,255,0.4)",
  shimmerSize = "0.06em",
  shimmerDuration = "3s",
  borderRadius = "12px",
  background = "linear-gradient(135deg, #E8C7C3, #D8B0AC)",
  className,
  children,
  ...props
}: ShimmerButtonProps) {
  return (
    <button
      style={
        {
          "--spread": "90deg",
          "--shimmer-color": shimmerColor,
          "--radius": borderRadius,
          "--speed": shimmerDuration,
          "--cut": shimmerSize,
          "--bg": background,
        } as React.CSSProperties
      }
      className={cn(
        "group relative z-0 flex cursor-pointer items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap",
        "border border-white/20 font-semibold text-white",
        "[background:var(--bg)] [border-radius:var(--radius)]",
        "transform-gpu transition-all duration-300 ease-in-out active:scale-[0.97]",
        "hover:shadow-lg hover:shadow-[#E8C7C3]/30",
        className,
      )}
      {...props}
    >
      {/* Spinning shimmer ring */}
      <div
        className={cn(
          "absolute inset-0 overflow-visible blur-[2px]",
          "[container-type:size]",
        )}
      >
        <div className="absolute inset-0 h-[100cqh] animate-spin-around [aspect-ratio:1] [border-radius:0] [mask:none]">
          <div
            className="absolute inset-[-100%] w-auto rotate-0 animate-shimmer-slide"
            style={{
              background: `conic-gradient(from calc(270deg - (var(--spread) * 0.5)), transparent 0, var(--shimmer-color) var(--spread), transparent var(--spread))`,
            }}
          />
        </div>
      </div>

      {/* Highlight overlay */}
      <div
        className={cn(
          "absolute inset-0 size-full rounded-[inherit]",
          "shadow-[inset_0_-6px_12px_rgba(255,255,255,0.15)]",
          "group-hover:shadow-[inset_0_-6px_12px_rgba(255,255,255,0.25)]",
          "transition-shadow duration-300",
        )}
      />

      {/* Background cutout */}
      <div
        className="absolute -z-20 [background:var(--bg)] [border-radius:var(--radius)] [inset:var(--cut)]"
      />

      {/* Content */}
      <span className="relative z-10 flex items-center gap-1.5">{children}</span>
    </button>
  );
}
