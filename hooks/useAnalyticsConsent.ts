"use client";

import { useEffect, useState } from "react";
import { hasKlaroConsent } from "@/components/KlaroCookieConsent";

/**
 * Whether the visitor has granted the "analytics" consent purpose in the Klaro
 * cookie banner (rendered in app/layout.tsx). Analytics/tracking scripts (Google
 * Analytics, Microsoft Clarity, ...) must not load before this is true — Klaro
 * dispatches a `klaro-analytics-consent` event whenever the choice changes, so this
 * re-checks live instead of requiring a page reload after the user responds to the banner.
 */
export function useAnalyticsConsent(): boolean {
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    setConsent(hasKlaroConsent("analytics"));

    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ consent: boolean }>).detail;
      setConsent(Boolean(detail?.consent));
    };

    window.addEventListener("klaro-analytics-consent", handler);
    return () => window.removeEventListener("klaro-analytics-consent", handler);
  }, []);

  return consent;
}
