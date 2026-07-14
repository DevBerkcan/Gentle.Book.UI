// components/Footer.tsx
"use client";

import { motion } from "framer-motion";
import { KlaroCookieSettingsButton } from "./KlaroCookieConsent";

export const Footer = () => {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8 }}
      className="mt-12 pb-8 text-center"
    >
      <div className="mb-4 flex items-center justify-center gap-4 text-xs text-[#8A8A8A]">
        <a
          href="/impressum"
          className="transition-colors hover:text-[#ECEBF2] hover:underline"
        >
          Impressum
        </a>
        <span className="text-[#ECEBF2]">•</span>
        <a
          href="/datenschutz"
          className="transition-colors hover:text-[#ECEBF2] hover:underline"
        >
          Datenschutz
        </a>
        <span className="text-[#ECEBF2]">•</span>
        <KlaroCookieSettingsButton />
      </div>

      <p className="text-xs text-[#8A8A8A]">
        © {new Date().getFullYear()} GentleBook. Alle Rechte vorbehalten.
      </p>
    </motion.footer>
  );
};
