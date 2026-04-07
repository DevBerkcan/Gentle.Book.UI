"use client";

import { useTrackingCapture, usePageTracking } from "@/hooks/useTracking";

export function TrackingProvider({ children }: { children: React.ReactNode }) {
  // Capture UTM parameters on first visit
  useTrackingCapture();

  // Track page views
  usePageTracking();

  return <>{children}</>;
}
