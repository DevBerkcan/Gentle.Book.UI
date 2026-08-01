"use client";

import { GoogleAnalytics as NextGoogleAnalytics } from "@next/third-parties/google";
import { useAnalyticsConsent } from "@/hooks/useAnalyticsConsent";

export function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const hasConsent = useAnalyticsConsent();

  if (!gaId || !hasConsent) {
    // No GA ID set, or the visitor hasn't (yet) granted analytics consent in the
    // Klaro cookie banner — never load the GA script unconditionally.
    return null;
  }

  return <NextGoogleAnalytics gaId={gaId} />;
}
