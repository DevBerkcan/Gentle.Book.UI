"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gradient-to-br from-[#F5EDEB] to-white flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-gradient-to-br from-[#E8C7C3] to-[#D8B0AC] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#E8C7C3]/30">
              <AlertTriangle size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#1E1E1E] mb-2">Etwas ist schiefgelaufen</h1>
            <p className="text-[#8A8A8A] text-sm mb-8">
              Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.
            </p>
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white text-sm shadow-lg shadow-[#E8C7C3]/20 transition-all hover:shadow-xl hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg, #E8C7C3, #D8B0AC)" }}
            >
              <RefreshCw size={16} />
              Seite neu laden
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
