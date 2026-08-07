// app/admin/intake-form/page.tsx
"use client";

import { useEffect, useState } from "react";
import { ClipboardList, TrendingUp, AlertTriangle, Plus, Trash2, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { adminApi, type IntakeFormField } from "@/lib/api/admin";

const FIELD_TYPE_LABEL: Record<IntakeFormField["fieldType"], string> = {
  Text: "Kurztext",
  Textarea: "Langtext",
  YesNo: "Ja/Nein",
  MultipleChoice: "Auswahl",
};

const inputCls =
  "w-full border border-[#E5E7EB] bg-white rounded-xl px-3 py-2.5 text-sm text-[#111318] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#6355E4]/25 focus:border-[#A5B4FC] transition-all";

export default function AdminIntakeFormPage() {
  const [fields, setFields] = useState<IntakeFormField[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsUpgrade, setNeedsUpgrade] = useState(false);
  const [upgradeInfo, setUpgradeInfo] = useState<{ message?: string; currentPlan?: string; requiredPlan?: string }>({});

  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState<IntakeFormField["fieldType"]>("Text");
  const [newOptions, setNewOptions] = useState("");
  const [newRequired, setNewRequired] = useState(false);
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setLoading(true); setError(null);
      const data = await adminApi.getIntakeFormFields();
      setFields(data);
    } catch (err: any) {
      if (err.response?.status === 402 && err.response?.data?.feature) {
        setNeedsUpgrade(true);
        setUpgradeInfo({
          message: err.response.data.message,
          currentPlan: err.response.data.currentPlan,
          requiredPlan: err.response.data.requiredPlan,
        });
      } else {
        setError(err.response?.data?.message || err.message || "Fehler beim Laden des Formulars");
      }
    } finally { setLoading(false); }
  }

  async function handleAdd() {
    if (!newLabel.trim()) return;
    setAdding(true);
    try {
      await adminApi.createIntakeFormField({
        label: newLabel.trim(),
        fieldType: newType,
        optionsJson: newType === "MultipleChoice" ? JSON.stringify(newOptions.split(",").map((s) => s.trim()).filter(Boolean)) : null,
        isRequired: newRequired,
      });
      setNewLabel(""); setNewOptions(""); setNewRequired(false); setNewType("Text");
      await load();
    } catch {
      // keep form filled so the admin can retry
    } finally {
      setAdding(false);
    }
  }

  async function handleToggleActive(field: IntakeFormField) {
    setBusyId(field.id);
    try {
      await adminApi.updateIntakeFormField(field.id, {
        label: field.label, fieldType: field.fieldType, optionsJson: field.optionsJson, isRequired: field.isRequired, isActive: !field.isActive,
      });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(field: IntakeFormField) {
    if (!confirm(`Feld „${field.label}“ wirklich löschen?`)) return;
    setBusyId(field.id);
    try {
      await adminApi.deleteIntakeFormField(field.id);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function handleMove(field: IntakeFormField, direction: -1 | 1) {
    if (!fields) return;
    const sorted = [...fields].sort((a, b) => a.displayOrder - b.displayOrder);
    const idx = sorted.findIndex((f) => f.id === field.id);
    const swapWith = idx + direction;
    if (swapWith < 0 || swapWith >= sorted.length) return;
    [sorted[idx], sorted[swapWith]] = [sorted[swapWith], sorted[idx]];
    setBusyId(field.id);
    try {
      await adminApi.reorderIntakeFormFields(sorted.map((f) => f.id));
      await load();
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F8] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#E5E7EB] border-t-[#6355E4] rounded-full animate-spin" />
      </div>
    );
  }

  if (needsUpgrade) {
    return (
      <div className="min-h-screen bg-[#F7F7F8] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8 text-center max-w-md">
          <div className="w-12 h-12 bg-[#EEEBFC] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ClipboardList size={20} className="text-[#6355E4]" />
          </div>
          <h2 className="text-lg font-bold text-[#111318] mb-2">Anamneseformular</h2>
          {upgradeInfo.currentPlan && (
            <p className="text-xs text-[#9CA3AF] mb-3">
              Dein aktueller Tarif: <span className="font-semibold text-[#6B7280]">{upgradeInfo.currentPlan}</span>
            </p>
          )}
          <p className="text-sm text-[#6B7280] mb-6">
            {upgradeInfo.message ?? "Digitale Anamneseformulare sind in deinem aktuellen Tarif nicht enthalten."}
          </p>
          <a href="/admin/subscription"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6355E4] text-white text-sm font-semibold hover:bg-[#4338CA] transition-colors">
            <TrendingUp size={15} /> Jetzt upgraden
          </a>
        </div>
      </div>
    );
  }

  if (error || !fields) {
    return (
      <div className="min-h-screen bg-[#F7F7F8] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8 text-center max-w-sm">
          <div className="w-11 h-11 bg-[#FEE2E2] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={18} className="text-[#991B1B]" />
          </div>
          <p className="font-semibold text-[#111318] mb-1">Fehler beim Laden</p>
          <p className="text-sm text-[#6B7280]">{error || "Unbekannter Fehler"}</p>
        </div>
      </div>
    );
  }

  const sortedFields = [...fields].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="min-h-screen bg-[#F7F7F8] p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto space-y-5">

        <div>
          <h1 className="text-[22px] font-bold text-[#111318] tracking-tight">Anamneseformular</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">
            Ein gemeinsames Formular für alle Kund:innen. Nach der Buchung erhalten sie einen Link, es auszufüllen.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          {sortedFields.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-[#F3F4F6] rounded-2xl flex items-center justify-center mx-auto mb-3">
                <ClipboardList size={20} className="text-[#D1D5DB]" />
              </div>
              <p className="text-sm font-medium text-[#374151]">Noch keine Felder</p>
              <p className="text-xs text-[#9CA3AF] mt-1">Füge unten dein erstes Feld hinzu.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#F3F4F6]">
              {sortedFields.map((field, idx) => (
                <div key={field.id} className="p-4 flex items-center gap-3">
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => handleMove(field, -1)} disabled={idx === 0 || busyId === field.id}
                      className="text-[#9CA3AF] hover:text-[#6355E4] disabled:opacity-30">
                      <ArrowUp size={13} />
                    </button>
                    <button onClick={() => handleMove(field, 1)} disabled={idx === sortedFields.length - 1 || busyId === field.id}
                      className="text-[#9CA3AF] hover:text-[#6355E4] disabled:opacity-30">
                      <ArrowDown size={13} />
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#111318] truncate">
                      {field.label} {field.isRequired && <span className="text-[#991B1B]">*</span>}
                    </p>
                    <p className="text-[11px] text-[#9CA3AF]">
                      {FIELD_TYPE_LABEL[field.fieldType]}
                      {field.fieldType === "MultipleChoice" && field.optionsJson && (
                        <> · {(JSON.parse(field.optionsJson) as string[]).join(", ")}</>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleActive(field)}
                    disabled={busyId === field.id}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors disabled:opacity-50 ${
                      field.isActive ? "bg-[#ECFDF5] text-[#059669]" : "bg-[#F3F4F6] text-[#6B7280]"
                    }`}
                  >
                    {field.isActive ? "Aktiv" : "Inaktiv"}
                  </button>
                  <button
                    onClick={() => handleDelete(field)}
                    disabled={busyId === field.id}
                    className="text-[#9CA3AF] hover:text-[#991B1B] disabled:opacity-50"
                  >
                    {busyId === field.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5 space-y-3">
          <p className="text-sm font-semibold text-[#111318]">Neues Feld</p>
          <input
            type="text" value={newLabel} onChange={(e) => setNewLabel(e.target.value)}
            placeholder="z. B. Bekannte Allergien" className={inputCls}
          />
          <div className="flex gap-2">
            <select value={newType} onChange={(e) => setNewType(e.target.value as IntakeFormField["fieldType"])} className={inputCls}>
              <option value="Text">Kurztext</option>
              <option value="Textarea">Langtext</option>
              <option value="YesNo">Ja/Nein</option>
              <option value="MultipleChoice">Auswahl</option>
            </select>
            <label className="flex items-center gap-1.5 text-xs text-[#6B7280] whitespace-nowrap px-2">
              <input type="checkbox" checked={newRequired} onChange={(e) => setNewRequired(e.target.checked)} />
              Pflichtfeld
            </label>
          </div>
          {newType === "MultipleChoice" && (
            <input
              type="text" value={newOptions} onChange={(e) => setNewOptions(e.target.value)}
              placeholder="Optionen, mit Komma getrennt" className={inputCls}
            />
          )}
          <button
            onClick={handleAdd}
            disabled={adding || !newLabel.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#6355E4] px-3 py-2 text-xs font-semibold text-white hover:bg-[#5548CE] disabled:opacity-50"
          >
            {adding ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Feld hinzufügen
          </button>
        </div>
      </div>
    </div>
  );
}
