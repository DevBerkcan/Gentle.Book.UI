// hooks/useAnalytics.ts
"use client";

import { useEffect, useRef, useState } from "react";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');

const getSessionId = (): string => {
  if (typeof window === "undefined") return "";

  const SESSION_KEY = "tracking_session_id";
  let sessionId = localStorage.getItem(SESSION_KEY);

  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(SESSION_KEY, sessionId);
  }

  return sessionId;
};

const trackPageView = async (sessionId: string): Promise<boolean> => {
  try {
    const payload = {
      pageUrl: window.location.pathname,
      referrerUrl: document.referrer || undefined,
      sessionId,
    };

    const response = await fetch(`${API_BASE_URL}/admin/Tracking/pageview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });

    return response.ok;
  } catch {
    return false;
  }
};

const trackLinkClick = async (linkName: string, linkUrl: string, sessionId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/tracking/click`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ linkName, linkUrl, sessionId }),
      keepalive: true,
    });

    return response.ok;
  } catch {
    return false;
  }
};

export const useAnalytics = () => {
  const pageLoadTime = useRef<number>(Date.now());
  const [hasAnalyticsConsent, setHasAnalyticsConsent] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const hasTrackedPageView = useRef(false);

  useEffect(() => {
    setSessionId(getSessionId());
  }, []);

  useEffect(() => {
    const checkConsent = () => {
      const consent = true; // TEMP: Always true for testing
      setHasAnalyticsConsent(consent);
    };

    checkConsent();

    if (typeof window !== "undefined") {
      window.addEventListener("klaro-analytics-consent", checkConsent);
      return () => window.removeEventListener("klaro-analytics-consent", checkConsent);
    }
  }, []);

  useEffect(() => {
    if (!hasAnalyticsConsent || !sessionId || hasTrackedPageView.current) return;

    hasTrackedPageView.current = true;
    trackPageView(sessionId);
  }, [hasAnalyticsConsent, sessionId]);

  useEffect(() => {
    if (!hasAnalyticsConsent) return;

    const handleBeforeUnload = () => {
      // time on page available as: Math.round((Date.now() - pageLoadTime.current) / 1000)
      void pageLoadTime.current;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasAnalyticsConsent]);

  const trackEvent = async (eventName: string, data?: Record<string, any>): Promise<void> => {
    if (!hasAnalyticsConsent) return;

    if (eventName === "link_click" && data?.label && data?.href) {
      await trackLinkClick(data.label, data.href, sessionId);
    }
  };

  return { trackEvent };
};
