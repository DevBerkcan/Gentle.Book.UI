import Link from "next/link";
import { Calendar, Users, Zap, ArrowRight, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5EDEB] via-white to-[#F5EDEB] flex flex-col">

      {/* Nav */}
      <nav className="w-full px-6 py-5 flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-[#E8C7C3] to-[#D8B0AC] rounded-xl flex items-center justify-center shadow-sm">
            <Sparkles size={18} className="text-white" />
          </div>
          <span className="font-bold text-[#1E1E1E] text-lg tracking-tight">GentleBook</span>
        </div>
        <Link
          href="/admin/login"
          className="text-sm font-semibold text-[#1E1E1E] px-4 py-2 rounded-xl border border-[#E8C7C3]/50 hover:bg-[#E8C7C3]/10 transition-colors"
        >
          Admin Login
        </Link>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
        <div className="inline-flex items-center gap-2 bg-[#E8C7C3]/20 border border-[#E8C7C3]/40 rounded-full px-4 py-1.5 text-sm font-medium text-[#C4958F] mb-8">
          <span className="w-1.5 h-1.5 bg-[#C4958F] rounded-full animate-pulse" />
          Das moderne Buchungssystem
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold text-[#1E1E1E] mb-5 leading-tight max-w-2xl">
          Buchungen,{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E8C7C3] to-[#C4958F]">
            einfach gemacht
          </span>
        </h1>

        <p className="text-lg text-[#8A8A8A] max-w-md mb-10 leading-relaxed">
          GentleBook gibt deinem Unternehmen eine eigene Buchungsseite — professionell, schnell, schön.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/admin/login"
            className="flex items-center gap-2 bg-gradient-to-r from-[#E8C7C3] to-[#D8B0AC] text-white font-semibold px-7 py-3.5 rounded-2xl shadow-lg hover:shadow-xl hover:opacity-95 transition-all active:scale-[0.98]"
          >
            Jetzt anmelden <ArrowRight size={16} />
          </Link>
          <Link
            href="/booking/demo"
            className="flex items-center gap-2 bg-white text-[#1E1E1E] font-semibold px-7 py-3.5 rounded-2xl border border-[#E8C7C3]/30 hover:border-[#E8C7C3] hover:bg-[#F5EDEB]/50 transition-all active:scale-[0.98]"
          >
            Demo ansehen
          </Link>
        </div>
      </main>

      {/* Features */}
      <section className="max-w-4xl mx-auto w-full px-6 pb-16 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            icon: Calendar,
            title: "Online-Buchungen",
            desc: "Kunden buchen rund um die Uhr — ohne Anruf, ohne Wartezeit.",
          },
          {
            icon: Users,
            title: "Team-Management",
            desc: "Mitarbeiter, Arbeitszeiten und Verfügbarkeiten zentral verwalten.",
          },
          {
            icon: Zap,
            title: "Sofort startklar",
            desc: "In Minuten eingerichtet. Eigene URL, eigenes Design.",
          },
        ].map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="bg-white/70 backdrop-blur-sm border border-[#E8C7C3]/20 rounded-2xl p-6 hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-[#E8C7C3]/30 to-[#D8B0AC]/20 rounded-xl flex items-center justify-center mb-4">
              <Icon size={20} className="text-[#C4958F]" />
            </div>
            <h3 className="font-bold text-[#1E1E1E] mb-1.5">{title}</h3>
            <p className="text-sm text-[#8A8A8A] leading-relaxed">{desc}</p>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-[#B0A0A0]">
        Made with ♥ by{" "}
        <a href="mailto:support@gentlegroup.de" className="hover:text-[#C4958F] transition-colors">
          GentleGroup
        </a>
      </footer>
    </div>
  );
}
