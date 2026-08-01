"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api/client";
import { useAuth } from "@/lib/contexts/AuthContext";
import { ToastStack } from "@/components/admin/links/ToastStack";
import { QrCodeModal } from "@/components/admin/links/QrCodeModal";
import { LinksPageHeader } from "@/components/admin/links/LinksPageHeader";
import { DesignAccordion } from "@/components/admin/links/DesignAccordion";
import { AddLinkForm } from "@/components/admin/links/AddLinkForm";
import { LinksList } from "@/components/admin/links/LinksList";
import { LivePreviewPanel } from "@/components/admin/links/LivePreviewPanel";
import { MobilePreviewModal } from "@/components/admin/links/MobilePreviewModal";
import { DEFAULT_CONFIG, CMS_TEMPLATE_PACKS, INDUSTRY_PRESETS } from "@/components/admin/links/constants";
import type {
  LinkItem, LinktreeConfig, PageTemplate, PlanTier, PreviewDevice, SaveStatus, Theme, ToastMessage,
} from "@/components/admin/links/types";

let toastCounter = 0;

export default function AdminLinksPage() {
  const { user, isEmployee } = useAuth();
  const router = useRouter();
  useEffect(() => { if (isEmployee) router.replace('/admin/calendar'); }, [isEmployee, router]);
  const tenantSlug = (user as any)?.tenantSlug;

  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newIcon, setNewIcon] = useState("Instagram");
  const [editTitle, setEditTitle] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editIcon, setEditIcon] = useState("");

  const [theme, setTheme] = useState<Theme>("gradient");
  const [primaryColor, setPrimaryColor] = useState("#E8C7C3");
  const [config, setConfig] = useState<LinktreeConfig>(DEFAULT_CONFIG);
  const [industryType, setIndustryType] = useState<string>("Other");
  const [designOpen, setDesignOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [brandColors, setBrandColors] = useState<{ primary?: string; secondary?: string; accent?: string }>({});
  const [designSaving, setDesignSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaveArgsRef = useRef<{ theme: Theme; color: string; config: LinktreeConfig; silent: boolean } | null>(null);

  const [tenantPlan, setTenantPlan] = useState<PlanTier>("starter");
  const [showQR, setShowQR] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("mobile");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const saveDesign = useCallback(async (
    newTheme: Theme, newColor: string, newConfig: LinktreeConfig, silent = false
  ) => {
    lastSaveArgsRef.current = { theme: newTheme, color: newColor, config: newConfig, silent };
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      setDesignSaving(true);
      setSaveStatus("saving");
      try {
        await api.put("/tenant/settings", {
          primaryColor: newColor, linktreeStyle: newTheme,
          linktreeConfig: JSON.stringify(newConfig),
        });
        setPreviewKey((k) => k + 1);
        setSaveStatus("saved");
        if (!silent) showToast("success", "Design gespeichert");
      } catch {
        setSaveStatus("error");
        showToast("error", "Design konnte nicht gespeichert werden");
      } finally { setDesignSaving(false); }
    }, 600);
  }, [showToast]);

  useEffect(() => {
    if (saveStatus !== "saved") return;
    const timer = setTimeout(() => setSaveStatus("idle"), 2500);
    return () => clearTimeout(timer);
  }, [saveStatus]);

  const retrySave = useCallback(() => {
    const args = lastSaveArgsRef.current;
    if (!args) return;
    void saveDesign(args.theme, args.color, args.config, args.silent);
  }, [saveDesign]);

  async function applyPreset(key: string) {
    const preset = INDUSTRY_PRESETS[key] ?? INDUSTRY_PRESETS.Other;
    const newConfig: LinktreeConfig = { ...DEFAULT_CONFIG, ...config, ctaText: preset.ctaText, bgPattern: preset.bgPattern, buttonStyle: preset.buttonStyle };
    setTheme(preset.style); setPrimaryColor(preset.color); setConfig(newConfig);
    await saveDesign(preset.style, preset.color, newConfig, false);
    showToast("success", `Vorlage „${preset.label}" angewendet ✓`);
  }

  async function applyCmsTemplate(pack: typeof CMS_TEMPLATE_PACKS[number]) {
    const next: LinktreeConfig = { ...DEFAULT_CONFIG, ...config, ...pack.config, colorScheme: pack.key };
    setTheme(pack.theme); setPrimaryColor(pack.primaryColor); setConfig(next);
    await saveDesign(pack.theme, pack.primaryColor, next, false);
    showToast("success", `Paket „${pack.name}" angewendet`);
  }

  function selectPageTemplate(key: PageTemplate) {
    updateConfig("pageTemplate", key);
  }

  function applyBrandColors() {
    if (!brandColors.primary) return;
    const next: LinktreeConfig = {
      ...config,
      colorScheme: "brand",
      ctaColor: brandColors.accent || undefined,
    };
    setConfig(next);
    setPrimaryColor(brandColors.primary);
    saveDesign(theme, brandColors.primary, next, false);
    showToast("success", "Markenfarben aus den Einstellungen übernommen");
  }

  function applyColorScheme(palette: { key: string; primary: string; theme: Theme }) {
    const next = { ...config, colorScheme: palette.key };
    setConfig(next); setPrimaryColor(palette.primary); setTheme(palette.theme);
    saveDesign(palette.theme, palette.primary, next, true);
  }

  function updateConfig(field: keyof LinktreeConfig, value: string | boolean | undefined) {
    const next = { ...config, [field]: value };
    setConfig(next);
    saveDesign(theme, primaryColor, next, true);
  }

  function updateTheme(t: Theme) { setTheme(t); saveDesign(t, primaryColor, config, true); }
  function updateColor(c: string) { setPrimaryColor(c); saveDesign(theme, c, config, true); }

  const loadLinks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/links");
      setLinks(res.data);
    } catch { showToast("error", "Fehler beim Laden der Links"); }
    finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => {
    void loadLinks();
    api.get("/tenant/settings").then((res) => {
      const d = res.data?.data ?? res.data;
      if (d?.linktreeStyle) setTheme(d.linktreeStyle as Theme);
      if (d?.primaryColor) setPrimaryColor(d.primaryColor);
      setBrandColors({ primary: d?.primaryColor, secondary: d?.secondaryColor, accent: d?.accentColor });
      if (d?.linktreeConfig) {
        try { setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(d.linktreeConfig) }); } catch {}
      }
    }).catch(() => {});
    const slug = tenantSlug;
    if (slug) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/booking/${slug}/info`)
        .then(r => r.json()).then(d => { if (d?.industryType) setIndustryType(d.industryType); })
        .catch(() => {});
    }
    api.get("/tenant/subscription").then((res) => {
      const plan = res.data?.plan?.toLowerCase() ?? "starter";
      if (plan.includes("business")) setTenantPlan("business");
      else if (plan.includes("pro"))  setTenantPlan("pro");
      else                            setTenantPlan("starter");
    }).catch(() => {});
  }, [tenantSlug, loadLinks]);

  async function handleCreate() {
    if (!newTitle.trim() || !newUrl.trim()) return;
    setSaving(true);
    try {
      const res = await api.post("/admin/links", {
        title: newTitle.trim(),
        url: newUrl.trim().startsWith("http") ? newUrl.trim() : `https://${newUrl.trim()}`,
        iconType: newIcon,
      });
      setLinks((prev) => [...prev, res.data]);
      setNewTitle(""); setNewUrl(""); setNewIcon("Instagram");
      setShowAddForm(false);
      showToast("success", `„${newTitle.trim()}" hinzugefügt`);
    } catch { showToast("error", "Fehler beim Anlegen des Links"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`„${title}" wirklich löschen?`)) return;
    try {
      await api.delete(`/admin/links/${id}`);
      setLinks((prev) => prev.filter((l) => l.id !== id));
      showToast("success", `„${title}" gelöscht`);
    } catch { showToast("error", "Fehler beim Löschen"); }
  }

  function startEdit(link: LinkItem) {
    setEditingId(link.id); setEditTitle(link.title); setEditUrl(link.url); setEditIcon(link.iconType);
  }

  async function handleSaveEdit(id: string) {
    setSaving(true);
    try {
      const trimmed = editUrl.trim();
      const normalizedUrl = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
      const res = await api.put(`/admin/links/${id}`, { title: editTitle.trim(), url: normalizedUrl, iconType: editIcon });
      setLinks((prev) => prev.map((l) => (l.id === id ? res.data : l)));
      setEditingId(null);
      showToast("success", "Link gespeichert");
    } catch { showToast("error", "Fehler beim Speichern"); }
    finally { setSaving(false); }
  }

  async function handleToggleActive(link: LinkItem) {
    try {
      const res = await api.put(`/admin/links/${link.id}`, { isActive: !link.isActive });
      setLinks((prev) => prev.map((l) => (l.id === link.id ? res.data : l)));
      showToast("success", link.isActive ? "Link deaktiviert" : "Link aktiviert");
    } catch { showToast("error", "Fehler beim Aktualisieren"); }
  }

  async function moveLink(index: number, direction: "up" | "down") {
    const newLinks = [...links];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newLinks.length) return;
    [newLinks[index], newLinks[swapIndex]] = [newLinks[swapIndex], newLinks[index]];
    setLinks(newLinks);
    try { await api.patch("/admin/links/reorder", newLinks.map((l) => l.id)); }
    catch { showToast("error", "Fehler beim Sortieren"); }
  }

  const previewUrl = tenantSlug ? `/booking/${tenantSlug}` : null;

  const inputCls = "w-full border border-[#E5E7EB] bg-white rounded-xl px-3 py-2.5 text-sm text-[#111318] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#6355E4]/25 focus:border-[#A5B4FC] transition-all";

  return (
    <div className="min-h-screen bg-[#F7F7F8] lg:flex lg:flex-row lg:overflow-hidden lg:h-screen">
      <ToastStack toasts={toasts} />
      <QrCodeModal open={showQR} onClose={() => setShowQR(false)} tenantSlug={tenantSlug ?? ""} />

      {/* ══════════════════════════════════════════════════════════════════════
          LEFT EDITOR PANEL
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="lg:w-[500px] lg:flex-shrink-0 lg:overflow-y-auto lg:h-full p-5 sm:p-6">
        <div className="max-w-2xl mx-auto">
          <LinksPageHeader
            tenantSlug={tenantSlug ?? null}
            saveStatus={saveStatus}
            onRetrySave={retrySave}
            onShowQr={() => setShowQR(true)}
            onShowPreviewModal={() => setShowPreviewModal(true)}
            onAddLink={() => { setShowAddForm(true); setEditingId(null); }}
          />

          <DesignAccordion
            designOpen={designOpen}
            onToggleDesignOpen={() => setDesignOpen((v) => !v)}
            designSaving={designSaving}
            config={config}
            tenantPlan={tenantPlan}
            onSelectPack={applyCmsTemplate}
            onSelectTemplate={selectPageTemplate}
            brandColors={brandColors}
            onApplyBrandColors={applyBrandColors}
            updateConfig={updateConfig}
            theme={theme}
            primaryColor={primaryColor}
            industryType={industryType}
            updateTheme={updateTheme}
            updateColor={updateColor}
            applyColorScheme={applyColorScheme}
            applyPreset={applyPreset}
            inputCls={inputCls}
            showAdvanced={showAdvanced}
            onToggleAdvanced={() => setShowAdvanced((v) => !v)}
            tenantSlug={tenantSlug ?? null}
            onShowPreviewModal={() => setShowPreviewModal(true)}
          />

          <AddLinkForm
            open={showAddForm}
            onClose={() => setShowAddForm(false)}
            saving={saving}
            inputCls={inputCls}
            newIcon={newIcon} setNewIcon={setNewIcon}
            newTitle={newTitle} setNewTitle={setNewTitle}
            newUrl={newUrl} setNewUrl={setNewUrl}
            onCreate={handleCreate}
          />

          <LinksList
            ctaText={config.ctaText}
            links={links}
            loading={loading}
            showAddForm={showAddForm}
            onShowAddForm={() => setShowAddForm(true)}
            editingId={editingId} setEditingId={setEditingId}
            editTitle={editTitle} setEditTitle={setEditTitle}
            editUrl={editUrl} setEditUrl={setEditUrl}
            editIcon={editIcon} setEditIcon={setEditIcon}
            saving={saving}
            inputCls={inputCls}
            startEdit={startEdit}
            handleSaveEdit={handleSaveEdit}
            handleDelete={handleDelete}
            handleToggleActive={handleToggleActive}
            moveLink={moveLink}
          />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          RIGHT PREVIEW PANEL (desktop)
      ══════════════════════════════════════════════════════════════════════ */}
      {previewUrl && (
        <LivePreviewPanel
          previewUrl={previewUrl}
          previewKey={previewKey}
          previewDevice={previewDevice}
          setPreviewDevice={setPreviewDevice}
          designSaving={designSaving}
        />
      )}

      {previewUrl && (
        <MobilePreviewModal
          open={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          previewUrl={previewUrl}
          previewKey={previewKey}
        />
      )}
    </div>
  );
}
