// components/admin/settings/SettingsNav.tsx
// Sticky "on this page" navigation for the settings page — 13 section cards used to be a single
// unbroken scroll with no way to jump directly to e.g. "Farben" or "Rechnungsadresse". Desktop
// only (hidden on mobile, where a vertical scroll is still the normal, cheap pattern); fills the
// dead whitespace that otherwise sits unused next to the centered max-w content column.
//
// Positioning is hand-rolled (placeholder + conditional `position: fixed`) instead of plain CSS
// `position: sticky`: the shared admin shell (app/admin/layout.tsx) has an `overflow-x-hidden`
// ancestor on the content column, which per spec implicitly computes `overflow-y: auto` on that
// element too — making IT the sticky containing block instead of the viewport, even though it
// never actually scrolls (the real scroll happens on the window). That silently breaks native
// `sticky` here (confirmed: the ancestor's scrollTop stays 0 while the page scrolls). `position:
// fixed` isn't affected by that ancestor's overflow, so we track the placeholder's position on
// scroll/resize and toggle fixed positioning manually once it would scroll above the stick point.
"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageContext";

export interface SettingsNavItem {
  id: string;
  label: string;
}

const STICK_TOP = 24;

export function SettingsNav({ items }: { items: SettingsNavItem[] }) {
  const { t } = useTranslation();
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");
  const observerRef = useRef<IntersectionObserver | null>(null);
  const placeholderRef = useRef<HTMLDivElement>(null);
  const [fixedPos, setFixedPos] = useState<{ left: number; width: number } | null>(null);

  useEffect(() => {
    function updatePosition() {
      const el = placeholderRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.top <= STICK_TOP) {
        setFixedPos({ left: rect.left, width: rect.width });
      } else {
        setFixedPos(null);
      }
    }
    updatePosition();
    window.addEventListener("scroll", updatePosition, { passive: true });
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, []);

  useEffect(() => {
    const visibleIds = new Set<string>();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;
          if (entry.isIntersecting) visibleIds.add(id);
          else visibleIds.delete(id);
        }
        // Pick the visible section that appears first in document order, matching
        // the natural "what am I looking at right now" expectation while scrolling.
        const firstVisible = items.find((item) => visibleIds.has(item.id));
        if (firstVisible) setActiveId(firstVisible.id);
      },
      { rootMargin: "-10% 0px -70% 0px", threshold: 0 }
    );

    const observer = observerRef.current;
    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleClick(e: React.MouseEvent, id: string) {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveId(id);
  }

  return (
    <div ref={placeholderRef} className="hidden lg:block w-[200px] shrink-0 self-start">
      <nav
        className="max-h-[calc(100vh-3rem)] overflow-y-auto"
        style={fixedPos ? { position: "fixed", top: STICK_TOP, left: fixedPos.left, width: fixedPos.width } : undefined}
      >
        <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide px-3 mb-1.5">{t.admin.settingsPage.onThisPage}</p>
        <ul className="space-y-0.5">
          {items.map((item) => {
            const isActive = item.id === activeId;
            return (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={(e) => handleClick(e, item.id)}
                  className={`relative block pl-3.5 pr-3 py-1.5 text-[13px] rounded-lg transition-colors ${
                    isActive
                      ? "bg-[#EEEBFC] text-[#6355E4] font-semibold"
                      : "text-[#6B7280] hover:text-[#111318] hover:bg-[#F3F4F6]"
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-[#6355E4]" />
                  )}
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
