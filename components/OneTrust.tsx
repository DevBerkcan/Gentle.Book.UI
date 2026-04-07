// components/OneTrust.tsx
"use client";

import Script from "next/script";
import { useEffect } from "react";

interface OneTrustProps {
  domainId: string;
}

export const OneTrust = ({ domainId }: OneTrustProps) => {
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).OptanonWrapper = function () {
        console.log("OneTrust: Consent updated");
        window.dispatchEvent(new Event("onetrust-consent-updated"));
      };
    }
  }, []);

  if (!domainId) {
    console.warn("OneTrust Domain ID fehlt. Bitte in lib/config.ts konfigurieren.");
    return null;
  }

  return (
    <>
      <Script
        id="onetrust-banner-sdk"
        src="https://cdn.cookielaw.org/scripttemplates/otSDKStub.js"
        type="text/javascript"
        charSet="UTF-8"
        data-domain-script={domainId}
        strategy="beforeInteractive"
      />
      <Script
        id="onetrust-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            function OptanonWrapper() {
              console.log('OneTrust loaded');
            }
          `,
        }}
      />
    </>
  );
};

export const OneTrustSettingsButton = () => {
  const openPreferences = () => {
    if (typeof window !== "undefined" && (window as any).OneTrust) {
      (window as any).OneTrust.ToggleInfoDisplay();
    }
  };

  return (
    <button
      onClick={openPreferences}
      className="text-sm text-[#8A8A8A] hover:text-[#E8C7C3] transition-colors underline"
      aria-label="Cookie-Einstellungen ändern"
    >
      Cookie-Einstellungen
    </button>
  );
};