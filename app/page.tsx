import Link from "next/link";
import { Calendar, Users, Zap, ArrowRight, Sparkles } from "lucide-react";
import { supportConfig } from "@/lib/config";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F6F5FA] via-white to-[#F6F5FA] flex flex-col">

      {/* Nav */}
      <nav className="w-full px-6 py-5 flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-[#6355E4] to-[#17A398] rounded-xl flex items-center justify-center shadow-sm">
            <Sparkles size={18} className="text-white" />
          </div>
          <span className="font-bold text-[#14162B] text-lg tracking-tight">GentleBook</span>
        </div>
        <Link
          href="/admin/login"
          className="text-sm font-semibold text-[#14162B] px-4 py-2 rounded-xl border border-[#ECEBF2]/50 hover:bg-[#ECEBF2]/10 transition-colors"
        >
          Admin Login
        </Link>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
        <div className="inline-flex items-center gap-2 bg-[#ECEBF2]/20 border border-[#ECEBF2]/40 rounded-full px-4 py-1.5 text-sm font-medium text-[#5646D6] mb-8">
          <span className="w-1.5 h-1.5 bg-[#5646D6] rounded-full animate-pulse" />
          Das moderne Buchungssystem
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold text-[#14162B] mb-5 leading-tight max-w-2xl">
          Buchungen,{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6355E4] to-[#17A398]">
            einfach gemacht
          </span>
        </h1>

        <p className="text-lg text-[#8A8A8A] max-w-md mb-10 leading-relaxed">
          GentleBook gibt deinem Unternehmen eine eigene Buchungsseite — professionell, schnell, schön.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/admin/login"
            className="flex items-center gap-2 bg-gradient-to-r from-[#6355E4] to-[#17A398] text-white font-semibold px-7 py-3.5 rounded-2xl shadow-lg hover:shadow-xl hover:opacity-95 transition-all active:scale-[0.98]"
          >
            Jetzt anmelden <ArrowRight size={16} />
          </Link>
          <Link
            href="/booking/demo"
            className="flex items-center gap-2 bg-white text-[#14162B] font-semibold px-7 py-3.5 rounded-2xl border border-[#ECEBF2]/30 hover:border-[#ECEBF2] hover:bg-[#F6F5FA]/50 transition-all active:scale-[0.98]"
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
            className="bg-white/70 backdrop-blur-sm border border-[#ECEBF2]/20 rounded-2xl p-6 hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-[#6355E4]/10 to-[#17A398]/10 rounded-xl flex items-center justify-center mb-4">
              <Icon size={20} className="text-[#5646D6]" />
            </div>
            <h3 className="font-bold text-[#14162B] mb-1.5">{title}</h3>
            <p className="text-sm text-[#8A8A8A] leading-relaxed">{desc}</p>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-[#B0A0A0]">
        Made with ♥ by{" "}
        <a href={supportConfig.mailto()} className="hover:text-[#5646D6] transition-colors">
          GentleGroup
        </a>
      </footer>
    </div>
  );
}
