// Type definitions for Klaro (loaded via CDN)
declare global {
  interface Window {
    klaro?: {
      show(): void;
      getManager(): {
        getConsent(serviceName: string): boolean;
      };
    };
    klaroConfig?: any;
  }
}

export {};
