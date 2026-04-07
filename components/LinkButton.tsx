// components/LinkButton.tsx
"use client";

import { motion } from "framer-motion";
import { LucideIcon, Sparkles } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface LinkButtonProps {
  href: string;
  label: string;
  icon: LucideIcon;
  position: number;
  variant?: "primary" | "secondary";
  onTrackClick?: (label: string, href: string) => void;
}

export const LinkButton = ({
  href,
  label,
  icon: Icon,
  position,
  variant = "primary",
  onTrackClick,
}: LinkButtonProps) => {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (onTrackClick) {
      onTrackClick(label, href);
    }
    
    if (href.startsWith("/")) {
      router.push(href);
    } else {
      window.open(href, "_blank", "noopener,noreferrer");
    }
  };

  const isPrimary = variant === "primary";

  return (
    <motion.button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: 0.1 * position,
        duration: 0.4,
      }}
      whileHover={{
        scale: 1.02,
        transition: { duration: 0.2 },
      }}
      whileTap={{
        scale: 0.98,
      }}
      className={`
        group relative flex w-full items-center justify-between gap-3 overflow-hidden
        rounded-2xl px-6 py-4 shadow-md transition-all duration-300
        hover:shadow-xl focus-visible:shadow-xl cursor-pointer
        ${
          isPrimary
            ? "bg-gradient-to-r from-[#E8C7C3] to-[#D8B0AC] text-white hover:from-[#D8B0AC] hover:to-[#C09995]"
            : "border-2 border-[#E8C7C3] bg-white text-[#1E1E1E] hover:border-[#D8B0AC] hover:bg-[#F5EDEB]"
        }
      `}
      aria-label={`${label} öffnen`}
    >
      {/* Background gradient effect on hover */}
      <motion.div
        className={`absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-10 ${
          isPrimary ? "bg-white" : "bg-[#E8C7C3]"
        }`}
        initial={false}
      />

      {/* Icon */}
      <motion.div
        className="relative z-10"
        whileHover={{ rotate: [0, -10, 10, 0] }}
        transition={{ duration: 0.5 }}
      >
        <Icon
          size={24}
          className={isPrimary ? "text-white" : "text-[#E8C7C3]"}
        />
      </motion.div>

      {/* Label */}
      <span className="relative z-10 flex-1 text-left font-semibold">
        {label}
      </span>

      {/* Arrow indicator */}
      <motion.svg
        className={`relative z-10 h-5 w-5 ${
          isPrimary ? "text-white" : "text-[#8A8A8A]"
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        initial={{ x: 0 }}
        animate={{ x: isHovered ? 5 : 0 }}
        transition={{ duration: 0.3 }}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </motion.svg>

      {/* Shine effect on hover */}
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent opacity-20"
        animate={{
          translateX: isHovered ? ["100%", "200%"] : "-100%",
        }}
        transition={{ duration: 0.6 }}
      />

      {isHovered && (
        <motion.div
          initial={{ x: -20, y: -10, opacity: 0, rotate: -45 }}
          animate={{ x: 5, y: -5, opacity: 0.3, rotate: -30 }}
          exit={{ x: 20, y: 0, opacity: 0, rotate: -15 }}
          transition={{ duration: 0.3 }}
          className="absolute left-2 top-2 pointer-events-none"
        >
          <Sparkles
            size={16}
            className={isPrimary ? "text-white" : "text-[#E8C7C3]"}
          />
        </motion.div>
      )}
    </motion.button>
  );
};