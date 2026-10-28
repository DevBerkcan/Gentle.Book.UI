// app/admin/api-keys/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import {
  KeyRound, Plus, Copy, Check, Trash2, AlertTriangle, TrendingUp, Code2,
} from 'lucide-react';
import { adminApi, type ApiKeySummary } from '@/lib/api/admin';
import { useConfirm } from '@/components/ConfirmDialog';
import { useTranslation, fillTemplate } from '@/lib/i18n/LanguageContext';

export default function ApiKeysPage() {
  const { isEmployee } = useAuth();
  const { t, lang } = useTranslation();
  const s = t.admin.apiKeysPage;
  const dateLocale = lang === 'de' ? 'de-DE' : 'en-US';
  const router = useRouter();
  useEffect(() => { if (isEmployee) router.replace('/admin/calendar'); }, [isEmployee, router]);

  const [keys, setKeys] = useState<ApiKeySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsUpgrade, setNeedsUpgrade] = useState(false);
  const [upgradeInfo, setUpgradeInfo] = useState<{ message?: string; currentPlan?: string; requiredPlan?: string }>({});
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [revealedKey, setRevealedKey] = useState<{ name: string; rawKey: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const { confirm, dialog } = useConfirm();

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setLoading(true); setError('');
      const data = await adminApi.getApiKeys();
      setKeys(data);
    } catch (err: any) {
      if (err.response?.status === 402 && err.response?.data?.feature === 'api_access') {
        setNeedsUpgrade(true);
        setUpgradeInfo({
          message: err.response.data.message,
          currentPlan: err.response.data.currentPlan,
          requiredPlan: err.response.data.requiredPlan,
        });
      } else {
        setError(err.response?.data?.message || s.loadError);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!newKeyName.trim() || creating) return;
    setCreating(true); setError('');
    try {
      const created = await adminApi.createApiKey(newKeyName.trim());
      setRevealedKey({ name: created.name, rawKey: created.rawKey });
      setNewKeyName('');
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || s.createError);
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(key: ApiKeySummary) {
    const ok = await confirm({
      title: fillTemplate(s.revokeConfirmTitleTemplate, { name: key.name }),
      message: s.revokeConfirmMessage,
      confirmLabel: s.revokeConfirmLabel,
      variant: 'danger',
    });
    if (!ok) return;
    setRevoking(key.id);
    try {
      await adminApi.revokeApiKey(key.id);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || s.revokeError);
    } finally {
      setRevoking(null);
    }
  }

  function handleCopy() {
    if (!revealedKey) return;
    navigator.clipboard.writeText(revealedKey.rawKey).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="w-5 h-5 border-2 border-[#E5E7EB] border-t-[#6355E4] rounded-full animate-spin" />
      </div>
    );
  }

  if (needsUpgrade) {
    return (
      <div className="min-h-screen bg-[#F7F7F8] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8 text-center max-w-md">
          <div className="w-12 h-12 bg-[#EEEBFC] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <KeyRound size={20} className="text-[#6355E4]" />
          </div>
          <h2 className="text-lg font-bold text-[#111318] mb-2">{t.admin.apiAccess}</h2>
          {upgradeInfo.currentPlan && (
            <p className="text-xs text-gb-textMuted mb-3">
              {s.currentPlanLabel} <span className="font-semibold text-[#6B7280]">{upgradeInfo.currentPlan}</span>
            </p>
          )}
          <p className="text-sm text-[#6B7280] mb-6">
            {upgradeInfo.message ?? s.upgradeDefaultMessage}
          </p>
          <a
            href="/admin/subscription"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6355E4] text-white text-sm font-semibold hover:bg-[#4338CA] transition-colors"
          >
            <TrendingUp size={15} /> {s.upgradeNowBtn}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {dialog}

      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <KeyRound size={22} className="text-[#6355E4]" /> {t.admin.apiAccess}
        </h1>
        <p className="text-gray-500 mt-1">
          {s.pageSubtitle}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-start gap-3">
        <Code2 size={18} className="text-[#6355E4] shrink-0 mt-0.5" />
        <div className="text-sm text-gray-600">
          <p className="font-semibold text-gray-900 mb-1">{s.usageTitle}</p>
          <p>{s.usageSendPrefix} <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">X-Api-Key</code> {s.usageToPrefix} <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">/api/v1/services</code>, <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">/api/v1/employees</code> {s.usageOrWord} <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">/api/v1/bookings</code>.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-2 text-sm text-red-700">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* Reveal dialog */}
      {revealedKey && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5">
          <p className="font-semibold text-amber-800 mb-1">{fillTemplate(s.revealedKeyTitleTemplate, { name: revealedKey.name })}</p>
          <p className="text-xs text-amber-700 mb-3">{s.copyNowHint}</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white border border-amber-200 rounded-xl px-3 py-2.5 text-sm font-mono text-gray-800 overflow-x-auto whitespace-nowrap">
              {revealedKey.rawKey}
            </code>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition-colors shrink-0"
            >
              {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? t.admin.copied : t.admin.copy}
            </button>
          </div>
          <button
            onClick={() => setRevealedKey(null)}
            className="mt-3 text-xs text-amber-700 hover:text-amber-900 font-medium"
          >
            {s.closeRevealedKeyBtn}
          </button>
        </div>
      )}

      {/* Create form */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <p className="font-semibold text-gray-900 mb-3">{s.createKeyTitle}</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder={s.newKeyPlaceholder}
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6355E4]/25 focus:border-[#A5B4FC]"
          />
          <button
            onClick={handleCreate}
            disabled={!newKeyName.trim() || creating}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#6355E4] hover:bg-[#5646D6] text-white text-sm font-semibold disabled:opacity-40 transition-colors"
          >
            {creating ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={15} />}
            {s.createBtn}
          </button>
        </div>
      </div>

      {/* Key list */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {keys.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">{s.noApiKeysYet}</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {keys.map((key) => (
              <div key={key.id} className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{key.name}</p>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{key.keyPrefix}…</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {s.createdLabel} {new Date(key.createdAt).toLocaleDateString(dateLocale)}
                    {key.lastUsedAt && ` · ${s.lastUsedLabel} ${new Date(key.lastUsedAt).toLocaleDateString(dateLocale)}`}
                    {key.revokedAt && ` · ${s.revokedLabel} ${new Date(key.revokedAt).toLocaleDateString(dateLocale)}`}
                  </p>
                </div>
                {!key.revokedAt && (
                  <button
                    onClick={() => handleRevoke(key)}
                    disabled={revoking === key.id}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium disabled:opacity-40 transition-colors shrink-0"
                  >
                    {revoking === key.id ? <span className="w-3.5 h-3.5 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" /> : <Trash2 size={13} />}
                    {s.revokeBtn}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
