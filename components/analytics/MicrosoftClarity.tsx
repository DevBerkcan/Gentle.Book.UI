"use client";

import Script from "next/script";
import { useAnalyticsConsent } from "@/hooks/useAnalyticsConsent";

const CLARITY_PROJECT_ID = "xvh6dktj78";

export function MicrosoftClarity() {
  const hasConsent = useAnalyticsConsent();

  if (!hasConsent) {
    // Same "analytics" consent purpose as Google Analytics — never load unconditionally.
    return null;
  }

  return (
    <Script id="microsoft-clarity" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");`}
    </Script>
  );
}
