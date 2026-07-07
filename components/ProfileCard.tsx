// components/ProfileCard.tsx
"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { GentleBookMark } from "@/components/admin/GentleBookLogo";

export const ProfileCard = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative mb-8 text-center"
    >
      <motion.div
        animate={{
          y: [0, -15, 0],
          rotate: [-25, -20, -25],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -top-6 right-8 text-[#ECEBF2] opacity-40"
        aria-hidden="true"
      >
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Sparkles size={36} strokeWidth={2} />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{
          opacity: 0.3,
          scale: 1,
          y: [0, 10, 0],
          rotate: [155, 160, 155],
        }}
        transition={{
          opacity: { delay: 0.3, duration: 0.5 },
          scale: { delay: 0.3, duration: 0.5 },
          y: { duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
          rotate: {
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          },
        }}
        className="absolute -top-4 left-6 text-[#8B8FA6] opacity-30"
        aria-hidden="true"
      >
        <Sparkles size={28} strokeWidth={2} />
      </motion.div>

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="mx-auto mb-6 flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-white shadow-lg ring-4 ring-white"
      >
        <GentleBookMark size={96} />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mb-3 text-3xl font-extrabold tracking-tight text-[#14162B]"
      >
        GentleBook<span className="text-[#17A398]">.</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mb-4 px-4 text-base text-[#8A8A8A] text-balance"
      >
        Das smarte Buchungssystem für Ihren Salon
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col items-center justify-center gap-2 text-sm text-[#8A8A8A]"
      >
        <div className="flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#ECEBF2]" />
          <span>Elisabethenstrasse 41, 4051 Basel, Schweiz</span>
        </div>
        <span className="text-xs">Termine bequem online buchen oder telefonisch vereinbaren</span>
      </motion.div>

      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="mx-auto mt-6 h-1 w-16 rounded-full bg-gradient-to-r from-[#6355E4] via-[#17A398] to-[#6355E4]"
      />
    </motion.div>
  );
};
