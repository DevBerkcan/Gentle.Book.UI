// hooks/useLinkTracking.ts
"use client";

import { useCallback } from "react";
import { trackLinkClick } from "@/lib/api/admin";

export function useLinkTracking() {
  const trackClick = useCallback(async (linkName: string, linkUrl: string) => {
    // Generate or get session ID
    let sessionId = localStorage.getItem("tracking_session_id");
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2, 15) + 
                  Math.random().toString(36).substring(2, 15);
      localStorage.setItem("tracking_session_id", sessionId);
    }

    try {
      await trackLinkClick({
        linkName, 
        linkUrl,
        sessionId
      });
      console.log(`Tracked click: ${linkName}`);
    } catch (error) {
      console.error("Error tracking link click:", error);
    }
  }, []);

  return { trackClick };
}