// components/admin/links/DesignAccordion.tsx
// The collapsible "Seiten-Design" accordion — composes the template pickers,
// brand colors, CTA text and the advanced design options.
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Palette, ChevronDown, Loader2, Type, Eye } from "lucide-react";
import { TemplatePackPicker } from "./TemplatePackPicker";
import { PageTemplatePicker } from "./PageTemplatePicker";
import { BrandColorsEditor } from "./BrandColorsEditor";
import { AdvancedDesignOptions } from "./AdvancedDesignOptions";
import { BrandImportPanel } from "./BrandImportPanel";
import { CMS_TEMPLATE_PACKS, COLOR_PALETTES } from "./constants";
import type { BrandPreviewOverride, LinktreeConfig, PageTemplate, PlanTier, Theme } from "./types";

export function DesignAccordion({
  designOpen, onToggleDesignOpen, designSaving,
  config, tenantPlan, onSelectPack, onSelectTemplate,
  brandColors, onApplyBrandColors,
  updateConfig, theme, primaryColor, industryType, updateTheme, updateColor, applyColorScheme, applyPreset, inputCls,
  showAdvanced, onToggleAdvanced,
  tenantSlug, onShowPreviewModal,
  websiteUrl, onBrandPreviewOverrideChange, onBrandImportApplied, showToast,
}: {
  designOpen: boolean;
  onToggleDesignOpen: () => void;
  designSaving: boolean;
  config: LinktreeConfig;
  tenantPlan: PlanTier;
  onSelectPack: (pack: typeof CMS_TEMPLATE_PACKS[number]) => void;
  onSelectTemplate: (key: PageTemplate) => void;
  brandColors: { primary?: string; secondary?: string; accent?: string };
  onApplyBrandColors: () => void;
  updateConfig: (field: keyof LinktreeConfig, value: string | boolean | undefined) => void;
  theme: Theme;
  primaryColor: string;
  industryType: string;
  updateTheme: (t: Theme) => void;
  updateColor: (c: string) => void;
  applyColorScheme: (palette: typeof COLOR_PALETTES[number]) => void;
  applyPreset: (key: string) => void;
  inputCls: string;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
  tenantSlug: string | null;
  onShowPreviewModal: () => void;
  websiteUrl?: string | null;
  onBrandPreviewOverrideChange: (override: BrandPreviewOverride | null) => void;
  onBrandImportApplied: () => void;
  showToast: (type: "success" | "error", message: string) => void;
}) {
  return (
    <div className="mb-4 bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
      <button
        onClick={onToggleDesignOpen}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#F7F7F8] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#6355E4] flex items-center justify-center shadow-sm flex-shrink-0">
            <Palette size={14} className="text-white" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-[#111318] text-sm leading-tight">Seiten-Design</p>
            {!designOpen && (
              <p className="text-[11px] text-[#9CA3AF] leading-tight mt-0.5">Template · Farben · Layout · Animationen</p>
            )}
          </div>
          {designSaving && <Loader2 size={12} className="animate-spin text-[#6355E4] ml-1" />}
        </div>
        <ChevronDown size={15} className={`text-[#9CA3AF] transition-transform duration-200 ${designOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {designOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-[#F3F4F6] px-5 pb-6 space-y-6 pt-5">
              <BrandImportPanel
                defaultWebsiteUrl={websiteUrl}
                onPreviewOverrideChange={onBrandPreviewOverrideChange}
                onApplied={onBrandImportApplied}
                showToast={showToast}
              />

              <TemplatePackPicker config={config} tenantPlan={tenantPlan} onSelect={onSelectPack} />
              <PageTemplatePicker config={config} tenantPlan={tenantPlan} onSelect={onSelectTemplate} />
              <BrandColorsEditor brandColors={brandColors} onApply={onApplyBrandColors} />

              <div className="border-t border-[#F3F4F6] pt-5">
                <p className="text-[11px] font-semibold text-[#6B7280] mb-2 flex items-center gap-1.5">
                  <Type size={11} className="text-[#6355E4]" />CTA-Text (Buchungsbutton)
                </p>
                <input type="text" value={config.ctaText} onChange={(e) => updateConfig("ctaText", e.target.value)}
                  placeholder="Termin buchen" className={inputCls} />
              </div>

              <AdvancedDesignOptions
                open={showAdvanced} onToggle={onToggleAdvanced}
                config={config} theme={theme} primaryColor={primaryColor} industryType={industryType}
                updateConfig={updateConfig} updateTheme={updateTheme} updateColor={updateColor}
                applyColorScheme={applyColorScheme} applyPreset={applyPreset} inputCls={inputCls}
              />

              {tenantSlug && (
                <button onClick={onShowPreviewModal}
                  className="flex items-center gap-1.5 text-xs text-[#6355E4] hover:underline font-medium lg:hidden">
                  <Eye size={12} />Vorschau öffnen
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
