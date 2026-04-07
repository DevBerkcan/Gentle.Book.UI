"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { getUTMParameters, saveTrackingData, BookingEvents } from "@/lib/tracking";

// Hook um UTM-Parameter beim ersten Besuch zu speichern
export function useTrackingCapture() {
  useEffect(() => {
    const trackingData = getUTMParameters();

    // Speichere nur wenn UTM-Parameter vorhanden sind
    if (trackingData.utmSource || trackingData.utmMedium || trackingData.utmCampaign) {
      saveTrackingData(trackingData);
      console.log("[Tracking] UTM Parameters captured:", trackingData);
    }
    // Speichere auch wenn Referrer vorhanden ist (kam von anderer Seite)
    else if (trackingData.referrerUrl) {
      saveTrackingData(trackingData);
      console.log("[Tracking] Referrer captured:", trackingData.referrerUrl);
    }
  }, []);
}

// Hook um Page Views zu tracken
export function usePageTracking() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const fullPath = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    BookingEvents.pageView(fullPath);
  }, [pathname, searchParams]);
}
