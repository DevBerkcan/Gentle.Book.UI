"use client";

import { GoogleAnalytics as NextGoogleAnalytics } from "@next/third-parties/google";

export function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  if (!gaId) {
    // Kein GA ID gesetzt - im Development Mode
    return null;
  }

  return <NextGoogleAnalytics gaId={gaId} />;
}
