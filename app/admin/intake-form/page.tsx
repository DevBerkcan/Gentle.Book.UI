// app/admin/intake-form/page.tsx
"use client";

import { useEffect, useState } from "react";
import { ClipboardList, TrendingUp, AlertTriangle, Plus, Trash2, ArrowUp, ArrowDown, Loader2, Sparkles, Ban } from "lucide-react";
import { adminApi, type IntakeFormField, type IntakeFormFieldType, type IntakeFormType } from "@/lib/api/admin";
import { getAdminCategories, type AdminServiceCategory } from "@/lib/api/admin-services";
import { useTranslation, fillTemplate } from "@/lib/i18n/LanguageContext";
import type { Translations } from "@/lib/i18n/translations";
import { useConfirm } from "@/components/ConfirmDialog";

function getFieldTypeLabel(t: Translations): Record<IntakeFormFieldType, string> {
  const s = t.admin.intakeFormPage;
  return {
    Text: s.fieldTypeText,
    Textarea: s.fieldTypeTextarea,
    YesNo: s.fieldTypeYesNo,
    MultipleChoice: s.fieldTypeMultipleChoice,
    Checkboxes: s.fieldTypeCheckboxes,
    Date: s.fieldTypeDate,
  };
}

function getFormTypeLabel(t: Translations): Record<IntakeFormType, string> {
  const s = t.admin.intakeFormPage;
  return {
    Anamnese: s.formTypeAnamnese,
    Einverstaendnis: s.formTypeEinverstaendnis,
    Fragebogen: s.formTypeFragebogen,
    Nachsorge: s.formTypeNachsorge,
  };
}
const FORM_TYPE_ORDER: IntakeFormType[] = ["Anamnese", "Einverstaendnis", "Fragebogen", "Nachsorge"];

const inputCls =
  "w-full border border-[#E5E7EB] bg-white rounded-xl px-3 py-2.5 text-sm text-[#111318] placeholder:text-gb-textMuted focus:outline-none focus:ring-2 focus:ring-[#6355E4]/25 focus:border-[#A5B4FC] transition-all";

export default function AdminIntakeFormPage() {
  const { t } = useTranslation();
  const s = t.admin.intakeFormPage;
  const FIELD_TYPE_LABEL = getFieldTypeLabel(t);
  const FORM_TYPE_LABEL = getFormTypeLabel(t);
  const [fields, setFields] = useState<IntakeFormField[] | null>(null);
  const [categories, setCategories] = useState<AdminServiceCategory[]>([]);
  const [templates, setTemplates] = useState<{ key: string; label: string; fieldCount: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsUpgrade, setNeedsUpgrade] = useState(false);
  const [industryBlocked, setIndustryBlocked] = useState<string | null>(null);
  const [upgradeInfo, setUpgradeInfo] = useState<{ message?: string; currentPlan?: string; requiredPlan?: string }>({});

  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState<IntakeFormFieldType>("Text");
  const [newFormType, setNewFormType] = useState<IntakeFormType>("Anamnese");
  const [newOptions, setNewOptions] = useState("");
  const [newCategoryId, setNewCategoryId] = useState<string>("");
  const [newRequired, setNewRequired] = useState(false);
  const [newConditionalOnFieldId, setNewConditionalOnFieldId] = useState<string>("");
  const [newConditionalOnValue, setNewConditionalOnValue] = useState("");
  const [adding, setAdding] = useState(false);
  const [addFieldError, setAddFieldError] = useState<string | null>(null);
  const { confirm, dialog } = useConfirm();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [applyingTemplate, setApplyingTemplate] = useState<string | null>(null);
  const [templateCategoryId, setTemplateCategoryId] = useState<string>("");

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setLoading(true); setError(null); setNeedsUpgrade(false); setIndustryBlocked(null);
      const [fieldsData, categoriesData] = await Promise.all([
        adminApi.getIntakeFormFields(),
        getAdminCategories().catch(() => []),
      ]);
      setFields(fieldsData);
      setCategories(categoriesData);
      adminApi.getIntakeFormTemplates().then(setTemplates).catch(() => {});
    } catch (err: any) {
      if (err.response?.status === 402 && err.response?.data?.feature) {
        setNeedsUpgrade(true);
        setUpgradeInfo({
          message: err.response.data.message,
          currentPlan: err.response.data.currentPlan,
          requiredPlan: err.response.data.requiredPlan,
        });
      } else if (err.response?.status === 403 && err.response?.data?.feature === "intake_form_industry") {
        setIndustryBlocked(err.response.data.message);
      } else {
        setError(err.response?.data?.message || err.message || s.loadErrorFallback);
      }
    } finally { setLoading(false); }
  }

  function resetNewFieldForm() {
    setNewLabel(""); setNewOptions(""); setNewRequired(false); setNewType("Text");
    setNewFormType("Anamnese"); setNewCategoryId(""); setNewConditionalOnFieldId(""); setNewConditionalOnValue("");
    setAddFieldError(null);
  }

  async function handleAdd() {
    if (!newLabel.trim()) return;
    setAddFieldError(null);
    const needsOptions = newType === "MultipleChoice" || newType === "Checkboxes";
    const options = needsOptions ? newOptions.split(",").map((s) => s.trim()).filter(Boolean) : [];
    if (needsOptions && options.length < 2) {
      setAddFieldError(s.optionsRequiredError);
      return;
    }
    setAdding(true);
    try {
      await adminApi.createIntakeFormField({
        label: newLabel.trim(),
        fieldType: newType,
        formType: newFormType,
        optionsJson: needsOptions ? JSON.stringify(options) : null,
        categoryId: newCategoryId || null,
        conditionalOnFieldId: newConditionalOnFieldId || null,
        conditionalOnValue: newConditionalOnFieldId ? newConditionalOnValue : null,
        isRequired: newRequired,
      });
      resetNewFieldForm();
      await load();
    } catch (err: any) {
      // keep form filled so the admin can retry
      setAddFieldError(err.response?.data?.message || err.message || s.addFieldError);
    } finally {
      setAdding(false);
    }
  }

  async function handleToggleActive(field: IntakeFormField) {
    setBusyId(field.id);
    try {
      await adminApi.updateIntakeFormField(field.id, {
        label: field.label, fieldType: field.fieldType, formType: field.formType, optionsJson: field.optionsJson,
        categoryId: field.categoryId, conditionalOnFieldId: field.conditionalOnFieldId, conditionalOnValue: field.conditionalOnValue,
        isRequired: field.isRequired, isActive: !field.isActive,
      });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(field: IntakeFormField) {
    const ok = await confirm({ title: t.admin.delete, message: fillTemplate(s.deleteConfirmTemplate, { label: field.label }), variant: "danger" });
    if (!ok) return;
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

  async function handleApplyTemplate(key: string) {
    setApplyingTemplate(key);
    try {
      await adminApi.applyIntakeFormTemplate(key, templateCategoryId || null);
      setShowTemplates(false);
      await load();
    } finally {
      setApplyingTemplate(null);
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
          <h2 className="text-lg font-bold text-[#111318] mb-2">{s.title}</h2>
          {upgradeInfo.currentPlan && (
            <p className="text-xs text-gb-textMuted mb-3">
              {s.currentPlanLabel} <span className="font-semibold text-[#6B7280]">{upgradeInfo.currentPlan}</span>
            </p>
          )}
          <p className="text-sm text-[#6B7280] mb-6">
            {upgradeInfo.message ?? s.upgradeDefaultMessage}
          </p>
          <a href="/admin/subscription"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6355E4] text-white text-sm font-semibold hover:bg-[#4338CA] transition-colors">
            <TrendingUp size={15} /> {s.upgradeNowBtn}
          </a>
        </div>
      </div>
    );
  }

  if (industryBlocked) {
    return (
      <div className="min-h-screen bg-[#F7F7F8] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8 text-center max-w-md">
          <div className="w-12 h-12 bg-[#F3F4F6] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Ban size={20} className="text-gb-textMuted" />
          </div>
          <h2 className="text-lg font-bold text-[#111318] mb-2">{s.title}</h2>
          <p className="text-sm text-[#6B7280]">{industryBlocked}</p>
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
          <p className="font-semibold text-[#111318] mb-1">{s.loadErrorTitle}</p>
          <p className="text-sm text-[#6B7280]">{error || s.unknownError}</p>
        </div>
      </div>
    );
  }

  const sortedFields = [...fields].sort((a, b) => a.displayOrder - b.displayOrder);
  const fieldsByFormType = FORM_TYPE_ORDER.map((type) => ({
    type,
    fields: sortedFields.filter((f) => f.formType === type),
  })).filter((group) => group.fields.length > 0);

  return (
    <div className="min-h-screen bg-[#F7F7F8] p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto space-y-5">

        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-bold text-[#111318] tracking-tight">{s.title}</h1>
            <p className="text-sm text-[#6B7280] mt-0.5">
              {s.subtitle}
            </p>
          </div>
          {templates.length > 0 && (
            <button
              onClick={() => setShowTemplates((v) => !v)}
              className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-[#C7D2FE] bg-[#F8F7FF] px-3.5 py-2 text-xs font-semibold text-[#6355E4] hover:bg-[#EEEBFC]"
            >
              <Sparkles size={13} /> {s.useTemplateBtn}
            </button>
          )}
        </div>

        {showTemplates && (
          <div className="bg-white rounded-2xl border border-[#C7D2FE] shadow-sm p-5 space-y-3">
            <p className="text-sm font-semibold text-[#111318]">{s.applyTemplateTitle}</p>
            <p className="text-xs text-gb-textMuted">{s.applyTemplateDesc}</p>
            {categories.length > 0 && (
              <select value={templateCategoryId} onChange={(e) => setTemplateCategoryId(e.target.value)} className={inputCls}>
                <option value="">{s.allCategoriesOption}</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{fillTemplate(s.onlyForCategoryTemplate, { name: c.name })}</option>)}
              </select>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {templates.map((tpl) => (
                <button
                  key={tpl.key}
                  onClick={() => handleApplyTemplate(tpl.key)}
                  disabled={applyingTemplate !== null}
                  className="text-left rounded-xl border border-[#E5E7EB] p-3 hover:border-[#A5B4FC] hover:bg-[#F8F7FF] disabled:opacity-50 transition-colors"
                >
                  <p className="text-sm font-semibold text-[#111318]">{tpl.label}</p>
                  <p className="text-[11px] text-gb-textMuted">{fillTemplate(s.fieldCountTemplate, { count: tpl.fieldCount })}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          {sortedFields.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-[#F3F4F6] rounded-2xl flex items-center justify-center mx-auto mb-3">
                <ClipboardList size={20} className="text-[#D1D5DB]" />
              </div>
              <p className="text-sm font-medium text-[#374151]">{s.noFieldsYetTitle}</p>
              <p className="text-xs text-gb-textMuted mt-1">{s.noFieldsYetDesc}</p>
            </div>
          ) : (
            <div className="divide-y divide-[#F3F4F6]">
              {fieldsByFormType.map((group) => (
                <div key={group.type}>
                  <p className="px-4 pt-3 pb-1 text-[11px] font-semibold text-gb-textMuted uppercase tracking-widest">{FORM_TYPE_LABEL[group.type]}</p>
                  {group.fields.map((field) => {
                    const idx = sortedFields.indexOf(field);
                    return (
                      <div key={field.id} className="p-4 flex items-center gap-3">
                        <div className="flex flex-col gap-0.5">
                          <button onClick={() => handleMove(field, -1)} disabled={idx === 0 || busyId === field.id}
                            aria-label={fillTemplate(s.moveUpAriaTemplate, { label: field.label })}
                            className="text-gb-textMuted hover:text-[#6355E4] disabled:opacity-30">
                            <ArrowUp size={13} />
                          </button>
                          <button onClick={() => handleMove(field, 1)} disabled={idx === sortedFields.length - 1 || busyId === field.id}
                            aria-label={fillTemplate(s.moveDownAriaTemplate, { label: field.label })}
                            className="text-gb-textMuted hover:text-[#6355E4] disabled:opacity-30">
                            <ArrowDown size={13} />
                          </button>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#111318] truncate">
                            {field.label} {field.isRequired && <span className="text-[#991B1B]">*</span>}
                          </p>
                          <p className="text-[11px] text-gb-textMuted">
                            {FIELD_TYPE_LABEL[field.fieldType]}
                            {field.categoryId && (
                              <>{fillTemplate(s.onlyCategoryTemplate, { name: categories.find((c) => c.id === field.categoryId)?.name ?? s.categoryFallback })}</>
                            )}
                            {field.conditionalOnFieldId && (
                              <>{fillTemplate(s.conditionalTemplate, { field: fields?.find((f) => f.id === field.conditionalOnFieldId)?.label ?? '', value: field.conditionalOnValue ?? '' })}</>
                            )}
                            {(field.fieldType === "MultipleChoice" || field.fieldType === "Checkboxes") && field.optionsJson && (
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
                          {field.isActive ? s.activeLabel : s.inactiveLabel}
                        </button>
                        <button
                          onClick={() => handleDelete(field)}
                          disabled={busyId === field.id}
                          aria-label={fillTemplate(s.deleteFieldAriaTemplate, { label: field.label })}
                          className="text-gb-textMuted hover:text-[#991B1B] disabled:opacity-50"
                        >
                          {busyId === field.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5 space-y-3">
          <p className="text-sm font-semibold text-[#111318]">{s.newFieldTitle}</p>
          <input
            type="text" value={newLabel} onChange={(e) => setNewLabel(e.target.value)}
            placeholder={s.newFieldLabelPlaceholder} className={inputCls}
          />
          <div className="grid grid-cols-2 gap-2">
            <select value={newType} onChange={(e) => setNewType(e.target.value as IntakeFormFieldType)} className={inputCls}>
              {Object.entries(FIELD_TYPE_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <select value={newFormType} onChange={(e) => setNewFormType(e.target.value as IntakeFormType)} className={inputCls}>
              {FORM_TYPE_ORDER.map((type) => <option key={type} value={type}>{FORM_TYPE_LABEL[type]}</option>)}
            </select>
          </div>

          {(newType === "MultipleChoice" || newType === "Checkboxes") && (
            <input
              type="text" value={newOptions} onChange={(e) => setNewOptions(e.target.value)}
              placeholder={s.optionsPlaceholder} className={inputCls}
            />
          )}

          {addFieldError && <p className="text-xs text-[#991B1B] bg-[#FEE2E2] border border-[#FECACA] rounded-lg px-3 py-2">{addFieldError}</p>}

          {categories.length > 0 && (
            <select value={newCategoryId} onChange={(e) => setNewCategoryId(e.target.value)} className={inputCls}>
              <option value="">{s.appliesAllCategoriesOption}</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{fillTemplate(s.onlyForCategoryTemplate, { name: c.name })}</option>)}
            </select>
          )}

          {sortedFields.length > 0 && (
            <div className="flex gap-2">
              <select value={newConditionalOnFieldId} onChange={(e) => setNewConditionalOnFieldId(e.target.value)} className={inputCls}>
                <option value="">{s.alwaysShowOption}</option>
                {sortedFields.map((f) => <option key={f.id} value={f.id}>{fillTemplate(s.onlyWhenFieldOptionTemplate, { label: f.label })}</option>)}
              </select>
              {newConditionalOnFieldId && (
                <input
                  type="text" value={newConditionalOnValue} onChange={(e) => setNewConditionalOnValue(e.target.value)}
                  placeholder={s.conditionalValuePlaceholder} className={inputCls}
                />
              )}
            </div>
          )}

          <label className="flex items-center gap-1.5 text-xs text-[#6B7280]">
            <input type="checkbox" checked={newRequired} onChange={(e) => setNewRequired(e.target.checked)} />
            {s.requiredFieldLabel}
          </label>

          <button
            onClick={handleAdd}
            disabled={adding || !newLabel.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#6355E4] px-3 py-2 text-xs font-semibold text-white hover:bg-[#5548CE] disabled:opacity-50"
          >
            {adding ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} {s.addFieldBtn}
          </button>
        </div>
      </div>
      {dialog}
    </div>
  );
}
