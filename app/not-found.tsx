import Link from "next/link";
import { Sparkles, ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5EDEB] to-white flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-gradient-to-br from-[#E8C7C3] to-[#D8B0AC] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#E8C7C3]/30">
          <Sparkles size={28} className="text-white" />
        </div>

        <div className="text-7xl font-bold text-[#E8C7C3]/60 mb-2 tracking-tight">404</div>
        <h1 className="text-2xl font-bold text-[#1E1E1E] mb-2">Seite nicht gefunden</h1>
        <p className="text-[#8A8A8A] text-sm mb-8">
          Die gesuchte Seite existiert nicht oder wurde verschoben.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white text-sm shadow-lg shadow-[#E8C7C3]/20 transition-all hover:shadow-xl hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg, #E8C7C3, #D8B0AC)" }}
          >
            <ArrowLeft size={16} />
            Zur Startseite
          </Link>
          <Link
            href="/admin"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-[#017172] text-sm border border-[#017172]/20 bg-[#017172]/5 transition-all hover:bg-[#017172]/10 hover:-translate-y-0.5"
          >
            <Search size={16} />
            Admin-Bereich
          </Link>
        </div>
      </div>
    </div>
  );
}
