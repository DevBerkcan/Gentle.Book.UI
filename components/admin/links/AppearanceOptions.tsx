// components/admin/links/AppearanceOptions.tsx
// "Erweiterte Design-Optionen" → Farbpalette, Branchenvorlage, Hintergrund-Theme,
// Primärfarbe, Hintergrundmuster, Button-Form, Schriftart, Button-Farbe,
// Avatar-Form, Karten-Stil, Layout, Animationsgeschwindigkeit, Willkommen/Konfetti-Toggles.
"use client";

import { Pipette, Sparkles, Palette, Circle, Grid3x3, Minus, LayoutList, LayoutGrid, Wind, Smile, Zap } from "lucide-react";
import { COLOR_PALETTES, INDUSTRY_PRESETS, THEMES } from "./constants";
import { SectionLabel, OptionPill, Toggle } from "./shared";
import type { LinktreeConfig, Theme } from "./types";

export function AppearanceOptions({
  config, theme, primaryColor, industryType, updateConfig, updateTheme, updateColor, applyColorScheme, applyPreset,
}: {
  config: LinktreeConfig;
  theme: Theme;
  primaryColor: string;
  industryType: string;
  updateConfig: (field: keyof LinktreeConfig, value: string | boolean | undefined) => void;
  updateTheme: (t: Theme) => void;
  updateColor: (c: string) => void;
  applyColorScheme: (palette: typeof COLOR_PALETTES[number]) => void;
  applyPreset: (key: string) => void;
}) {
  return (
    <>
      {/* ── Farbpalette ─────────────────────────────────────── */}
      <div className="border-t border-[#F3F4F6] pt-5">
        <SectionLabel icon={<Pipette size={13} />}>Farbpalette</SectionLabel>
        <div className="grid grid-cols-4 gap-2">
          {COLOR_PALETTES.map((palette) => {
            const isActive = (config.colorScheme ?? "auto") === palette.key;
            return (
              <button key={palette.key} onClick={() => applyColorScheme(palette)} title={palette.name}
                className={`flex items-center gap-2 px-2 py-2 rounded-xl border transition-all ${
                  isActive
                    ? "border-[#A5B4FC] ring-1 ring-[#6355E4]/25 bg-[#EEEBFC]"
                    : "border-[#E5E7EB] bg-white hover:border-[#C7D2FE]"
                }`}
              >
                <div className="w-6 h-6 rounded-lg flex-shrink-0 shadow-sm"
                  style={{ background: `linear-gradient(135deg, ${palette.primary}, ${palette.bg})` }} />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-[#111318] leading-tight truncate">{palette.name}</p>
                  <p className="text-[9px] text-[#9CA3AF] font-mono leading-tight">{palette.primary}</p>
                </div>
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-[#9CA3AF] mt-2">Oder wähle unten eine eigene Primärfarbe</p>
      </div>

      {/* ── Branchenvorlage ─────────────────────────────────── */}
      <div className="border-t border-[#F3F4F6] pt-5">
        <SectionLabel icon={<Sparkles size={13} />}>Branchenvorlage</SectionLabel>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(INDUSTRY_PRESETS).map(([key, preset]) => {
            const isActive = key === industryType;
            return (
              <button key={key} onClick={() => applyPreset(key)}
                className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all text-left ${
                  isActive
                    ? "border-[#A5B4FC] bg-[#EEEBFC] ring-1 ring-[#6355E4]/25"
                    : "border-[#E5E7EB] bg-white hover:border-[#C7D2FE]"
                }`}
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                  style={{ background: `${preset.color}18`, border: `1.5px solid ${preset.color}44` }}>
                  {preset.emoji}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-[#111318] leading-tight truncate">{preset.label}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: preset.color }} />
                    <span className="text-[9px] text-[#9CA3AF] font-mono truncate">{preset.color}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Hintergrund-Theme ────────────────────────────────── */}
      <div className="border-t border-[#F3F4F6] pt-5">
        <SectionLabel icon={<Palette size={13} />}>Hintergrund-Theme</SectionLabel>
        <div className="grid grid-cols-5 gap-1.5">
          {THEMES.map((t) => {
            const bgPrev = t.value === "dark"
              ? "linear-gradient(135deg, #0f0f1a, #1a1a2e)"
              : t.value === "minimal" ? "#ffffff"
              : t.value === "bold" ? `linear-gradient(135deg, ${primaryColor}, ${primaryColor}99)`
              : t.value === "glass" ? `linear-gradient(135deg, ${primaryColor}44, ${primaryColor}22)`
              : `linear-gradient(135deg, ${primaryColor}33, #fff)`;
            return (
              <button key={t.value} onClick={() => updateTheme(t.value)}
                className={`flex flex-col items-center gap-1.5 p-1.5 rounded-xl transition-all ${
                  theme === t.value ? "ring-2 ring-[#6355E4]/50 ring-offset-1" : "hover:opacity-80"
                }`}>
                <div className="w-full h-9 rounded-lg"
                  style={{ background: bgPrev, border: t.value === "minimal" ? "1px solid #E5E7EB" : "none" }} />
                <span className={`text-[10px] font-semibold ${theme === t.value ? "text-[#6355E4]" : "text-[#9CA3AF]"}`}>
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Primärfarbe ──────────────────────────────────────── */}
      <div>
        <p className="text-[11px] font-semibold text-[#6B7280] mb-2.5 flex items-center gap-1.5">
          <Pipette size={11} className="text-[#6355E4]" />Primärfarbe
        </p>
        <div className="flex items-center gap-3">
          <input type="color" value={primaryColor} onChange={(e) => updateColor(e.target.value)}
            className="w-9 h-9 rounded-xl cursor-pointer border-2 border-[#E5E7EB] shadow-sm overflow-hidden"
            style={{ padding: "2px" }} />
          <div className="flex gap-1.5 flex-wrap">
            {["#E8C7C3", "#C9A96E", "#2C3E50", "#6B8E7F", "#D4A5C9", "#4A90D9", "#1A1A2E", "#E74C3C", "#2ECC71", "#9B59B6", "#F39C12", "#1ABC9C"].map((c) => (
              <button key={c} onClick={() => updateColor(c)}
                className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${primaryColor === c ? "border-[#6355E4] scale-110" : "border-white shadow-sm"}`}
                style={{ background: c }} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Hintergrundmuster ────────────────────────────────── */}
      <div>
        <p className="text-[11px] font-semibold text-[#6B7280] mb-2.5">Hintergrundmuster</p>
        <div className="flex gap-1.5 flex-wrap">
          {([
            { v: "none", icon: <Minus size={13} />, label: "Keins" },
            { v: "dots", icon: <Circle size={13} />, label: "Punkte" },
            { v: "waves", icon: <span className="text-xs">〜</span>, label: "Wellen" },
            { v: "grid", icon: <Grid3x3 size={13} />, label: "Raster" },
            { v: "circles", icon: <Circle size={15} />, label: "Kreise" },
          ] as const).map(({ v, icon, label }) => (
            <OptionPill key={v} active={config.bgPattern === v} onClick={() => updateConfig("bgPattern", v)}
              className="flex-col gap-0.5 px-3 py-2">
              {icon}<span>{label}</span>
            </OptionPill>
          ))}
        </div>
      </div>

      {/* ── Button-Form ──────────────────────────────────────── */}
      <div>
        <p className="text-[11px] font-semibold text-[#6B7280] mb-2.5">Button-Form</p>
        <div className="flex gap-2">
          {([
            { v: "rounded", label: "Abgerundet", cls: "rounded-xl" },
            { v: "pill", label: "Pill", cls: "rounded-full" },
            { v: "square", label: "Eckig", cls: "rounded-none" },
          ] as const).map(({ v, label, cls }) => (
            <button key={v} onClick={() => updateConfig("buttonStyle", v)}
              className={`flex-1 flex flex-col items-center gap-2 py-3 border text-xs font-medium transition-all ${cls} ${
                config.buttonStyle === v
                  ? "bg-[#EEEBFC] border-[#A5B4FC] text-[#6355E4]"
                  : "bg-white border-[#E5E7EB] text-[#6B7280] hover:border-[#C7D2FE]"
              }`}
            >
              <div className={`w-12 h-4 ${cls}`} style={{ background: primaryColor, opacity: 0.65 }} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Schriftart ───────────────────────────────────────── */}
      <div>
        <p className="text-[11px] font-semibold text-[#6B7280] mb-2.5">Schriftart</p>
        <div className="grid grid-cols-5 gap-1.5">
          {([
            { v: "inter", label: "Inter", font: "sans-serif" },
            { v: "playfair", label: "Playfair", font: "'Playfair Display', serif" },
            { v: "montserrat", label: "Montserrat", font: "'Montserrat', sans-serif" },
            { v: "dm-serif", label: "DM Serif", font: "'DM Serif Display', serif" },
            { v: "josefin", label: "Josefin", font: "'Josefin Sans', sans-serif" },
          ] as const).map(({ v, label, font }) => (
            <button key={v} onClick={() => updateConfig("fontFamily", v)}
              className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border text-center transition-all ${
                (config.fontFamily ?? "inter") === v
                  ? "bg-[#EEEBFC] border-[#A5B4FC] ring-1 ring-[#6355E4]/20"
                  : "bg-white border-[#E5E7EB] hover:border-[#C7D2FE]"
              }`}
              style={{ fontFamily: font }}
            >
              <span className="text-sm font-semibold text-[#111318]">Aa</span>
              <span className="text-[9px] text-[#9CA3AF] leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Button-Farbe ─────────────────────────────────────── */}
      <div>
        <p className="text-[11px] font-semibold text-[#6B7280] mb-2 flex items-center gap-1.5">
          <Pipette size={11} className="text-[#6355E4]" />Button-Farbe <span className="text-[#9CA3AF] font-normal">(optional)</span>
        </p>
        <div className="flex items-center gap-3">
          <input type="color" value={config.ctaColor ?? primaryColor} onChange={(e) => updateConfig("ctaColor", e.target.value)}
            className="w-9 h-9 rounded-xl cursor-pointer border-2 border-[#E5E7EB] shadow-sm overflow-hidden"
            style={{ padding: "2px" }} />
          <div className="flex gap-1.5 flex-wrap">
            {["#ffffff", "#111318", "#C9A96E", "#E74C3C", "#2ECC71", "#4A90D9"].map((c) => (
              <button key={c} onClick={() => updateConfig("ctaColor", c)}
                className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${config.ctaColor === c ? "border-[#6355E4] scale-110" : "border-white shadow-sm"}`}
                style={{ background: c }} />
            ))}
          </div>
          {config.ctaColor && (
            <button onClick={() => updateConfig("ctaColor", undefined)}
              className="text-[10px] text-[#9CA3AF] hover:text-[#374151] underline transition-colors">
              Reset
            </button>
          )}
        </div>
      </div>

      {/* ── Avatar-Form ──────────────────────────────────────── */}
      <div>
        <p className="text-[11px] font-semibold text-[#6B7280] mb-2.5">Avatar-Form</p>
        <div className="flex gap-2">
          {([
            { v: "circle", label: "Kreis", r: "9999px" },
            { v: "rounded", label: "Abgerundet", r: "12px" },
            { v: "square", label: "Quadrat", r: "3px" },
          ] as const).map(({ v, label, r }) => (
            <button key={v} onClick={() => updateConfig("avatarShape", v)}
              className={`flex-1 flex flex-col items-center gap-2 py-3 border rounded-xl text-xs font-medium transition-all ${
                (config.avatarShape ?? "circle") === v
                  ? "bg-[#EEEBFC] border-[#A5B4FC] text-[#6355E4]"
                  : "bg-white border-[#E5E7EB] text-[#6B7280] hover:border-[#C7D2FE]"
              }`}
            >
              <div className="w-7 h-7 border-2 border-current opacity-50" style={{ borderRadius: r }} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Karten-Stil ──────────────────────────────────────── */}
      <div>
        <p className="text-[11px] font-semibold text-[#6B7280] mb-2.5">Link-Karten Stil</p>
        <div className="grid grid-cols-4 gap-1.5">
          {([
            { v: "filled", label: "Filled", cls: "bg-white shadow-sm border border-[#E5E7EB]" },
            { v: "outlined", label: "Outlined", cls: "bg-transparent border-2 border-[#D1D5DB]" },
            { v: "gradient", label: "Gradient", cls: "bg-gradient-to-r from-[#F3F4F6] to-white border border-[#E5E7EB]" },
            { v: "ghost", label: "Ghost", cls: "bg-transparent" },
          ] as const).map(({ v, label, cls }) => (
            <button key={v} onClick={() => updateConfig("cardStyle", v)}
              className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                (config.cardStyle ?? "filled") === v
                  ? "border-[#A5B4FC] bg-[#EEEBFC] text-[#6355E4]"
                  : "border-[#E5E7EB] text-[#6B7280] bg-white hover:border-[#C7D2FE]"
              }`}
            >
              <div className={`w-9 h-4 rounded-lg ${cls}`} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Layout ───────────────────────────────────────────── */}
      <div>
        <p className="text-[11px] font-semibold text-[#6B7280] mb-2.5">Layout</p>
        <div className="flex gap-2">
          <OptionPill active={(config.layoutMode ?? "list") === "list"} onClick={() => updateConfig("layoutMode", "list")} className="flex-1 justify-center gap-2 flex items-center">
            <LayoutList size={13} />Liste
          </OptionPill>
          <OptionPill active={(config.layoutMode ?? "list") === "grid"} onClick={() => updateConfig("layoutMode", "grid")} className="flex-1 justify-center gap-2 flex items-center">
            <LayoutGrid size={13} />Grid (Bento)
          </OptionPill>
        </div>
      </div>

      {/* ── Animationsgeschwindigkeit ────────────────────────── */}
      <div>
        <p className="text-[11px] font-semibold text-[#6B7280] mb-2 flex items-center gap-1.5">
          <Wind size={11} className="text-[#6355E4]" />Animationsgeschwindigkeit
        </p>
        <div className="flex gap-1.5">
          {(["none", "slow", "normal", "fast"] as const).map((v) => (
            <OptionPill key={v} active={(config.animationSpeed ?? "normal") === v} onClick={() => updateConfig("animationSpeed", v)} className="flex-1 justify-center">
              {v === "none" ? "Keine" : v === "slow" ? "Langsam" : v === "normal" ? "Normal" : "Schnell"}
            </OptionPill>
          ))}
        </div>
      </div>

      {/* ── Toggles ──────────────────────────────────────────── */}
      <div className="space-y-2">
        {[
          {
            icon: <Smile size={13} className="text-[#9CA3AF]" />,
            label: "Willkommensnachricht",
            hint: "Tagline unterhalb des Profilbilds",
            value: config.showWelcome ?? false,
            onToggle: () => updateConfig("showWelcome", !config.showWelcome),
          },
          {
            icon: <Zap size={13} className="text-[#9CA3AF]" />,
            label: "Konfetti beim Buchen",
            hint: "Kurze Feier-Animation beim CTA-Klick",
            value: config.confetti ?? false,
            onToggle: () => updateConfig("confetti", !config.confetti),
          },
        ].map(({ icon, label, hint, value, onToggle }) => (
          <div key={label} className="flex items-center justify-between py-3 px-3.5 bg-[#F7F7F8] rounded-xl border border-[#F3F4F6]">
            <div className="flex items-center gap-2.5">
              {icon}
              <div>
                <p className="text-xs font-semibold text-[#111318]">{label}</p>
                <p className="text-[10px] text-[#9CA3AF]">{hint}</p>
              </div>
            </div>
            <Toggle on={value} onToggle={onToggle} />
          </div>
        ))}
      </div>
    </>
  );
}
