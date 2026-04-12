'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity, Building2, CheckCircle, XCircle, Zap, Calendar,
  UserPlus, RefreshCw, ArrowRight,
} from 'lucide-react';
import { superAdminApi, ActivityItem } from '@/lib/api/superadmin';

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  building: <Building2 size={15} />,
  check:    <CheckCircle size={15} />,
  ban:      <XCircle size={15} />,
  zap:      <Zap size={15} />,
  calendar: <Calendar size={15} />,
  user:     <UserPlus size={15} />,
};

const ACTIVITY_COLORS: Record<string, string> = {
  TenantCreated:    'bg-blue-100 text-blue-600',
  TenantActivated:  'bg-green-100 text-green-600',
  TenantDeactivated:'bg-red-100 text-red-600',
  TrialExtended:    'bg-amber-100 text-amber-600',
  BookingCreated:   'bg-purple-100 text-purple-600',
  UserCreated:      'bg-teal-100 text-teal-600',
};

const ACTIVITY_LABELS: Record<string, string> = {
  TenantCreated:    'System angelegt',
  TenantActivated:  'Aktiviert',
  TenantDeactivated:'Deaktiviert',
  TrialExtended:    'Trial verlängert',
  BookingCreated:   'Neue Buchung',
  UserCreated:      'User erstellt',
};

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'gerade eben';
  if (diff < 3600) return `vor ${Math.floor(diff / 60)} Min.`;
  if (diff < 86400) return `vor ${Math.floor(diff / 3600)} Std.`;
  if (diff < 604800) return `vor ${Math.floor(diff / 86400)} Tagen`;
  return new Date(dateStr).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
}

function groupByDay(items: ActivityItem[]) {
  const groups: Record<string, ActivityItem[]> = {};
  for (const item of items) {
    const day = new Date(item.timestamp).toLocaleDateString('de-DE', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    if (!groups[day]) groups[day] = [];
    groups[day].push(item);
  }
  return Object.entries(groups);
}

export default function ActivityPage() {
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('');

  async function load() {
    setLoading(true);
    try {
      const data = await superAdminApi.getActivity(100);
      setActivity(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = filter
    ? activity.filter(a => a.type === filter)
    : activity;

  const grouped = groupByDay(filtered);

  // Count per type
  const typeCounts: Record<string, number> = {};
  for (const item of activity) {
    typeCounts[item.type] = (typeCounts[item.type] ?? 0) + 1;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 -m-8 p-8 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plattform-Aktivitäten</h1>
          <p className="text-gray-400 text-sm mt-0.5">Ereignisse der letzten Wochen</p>
        </div>
        <button
          onClick={load}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg border border-gray-100 shadow-sm transition-colors"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Summary pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            filter === '' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
          }`}
        >
          <Activity size={11} />
          Alle ({activity.length})
        </button>
        {Object.entries(ACTIVITY_LABELS).map(([type, label]) => (
          typeCounts[type] ? (
            <button
              key={type}
              onClick={() => setFilter(filter === type ? '' : type)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                filter === type ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              <span className={`w-2 h-2 rounded-full inline-block ${ACTIVITY_COLORS[type]?.split(' ')[0]}`} />
              {label} ({typeCounts[type]})
            </button>
          ) : null
        ))}
      </div>

      {/* Feed */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-14 bg-white rounded-xl animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Activity size={36} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-500">Keine Aktivitäten gefunden</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([day, items]) => (
            <div key={day}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 px-1">{day}</p>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                {items.map((item, i) => (
                  <div key={i} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50/60 transition-colors">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${ACTIVITY_COLORS[item.type] ?? 'bg-gray-100 text-gray-500'}`}>
                      {ACTIVITY_ICONS[item.icon] ?? <Activity size={15} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-900">{item.title}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTIVITY_COLORS[item.type] ?? 'bg-gray-100 text-gray-500'}`}>
                          {ACTIVITY_LABELS[item.type] ?? item.type}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{item.detail}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-300">{timeAgo(item.timestamp)}</span>
                      {item.tenantId && (
                        <Link
                          href={`/superadmin/tenants/${item.tenantId}`}
                          className="p-1 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="System öffnen"
                        >
                          <ArrowRight size={13} />
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
