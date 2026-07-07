'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardBody } from '@nextui-org/card';
import { Button } from '@nextui-org/button';
import { Chip } from '@nextui-org/chip';
import { Input } from '@nextui-org/input';
import {
  ClipboardList, Trash2, Bell, Mail, Phone, Calendar,
  User, Search, RefreshCw, X
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getWaitlist, deleteWaitlistEntry, markWaitlistNotified,
  type WaitlistEntry,
} from '@/lib/api/waitlist';

const STATUS_LABEL: Record<string, string> = {
  Pending:  'Wartend',
  Notified: 'Benachrichtigt',
  Booked:   'Gebucht',
  Expired:  'Abgelaufen',
};

const STATUS_COLOR: Record<string, 'warning' | 'success' | 'primary' | 'default'> = {
  Pending:  'warning',
  Notified: 'primary',
  Booked:   'success',
  Expired:  'default',
};

export default function AdminWaitlistPage() {
  const { isEmployee } = useAuth();
  const router = useRouter();
  useEffect(() => { if (isEmployee) router.replace('/admin/calendar'); }, [isEmployee, router]);

  const [entries, setEntries]       = useState<WaitlistEntry[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate]     = useState('');
  const [search, setSearch]             = useState('');
  const [deleting, setDeleting]         = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getWaitlist({
        status: filterStatus || undefined,
        date:   filterDate   || undefined,
      });
      setEntries(data);
    } catch {
      toast.error('Fehler beim Laden der Warteliste');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterDate]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await deleteWaitlistEntry(id);
      setEntries(e => e.filter(x => x.id !== id));
      toast.success('Eintrag gelöscht');
    } catch {
      toast.error('Fehler beim Löschen');
    } finally {
      setDeleting(null);
    }
  };

  const handleMarkNotified = async (id: string) => {
    try {
      await markWaitlistNotified(id);
      setEntries(e => e.map(x => x.id === id ? { ...x, status: 'Notified', notifiedAt: new Date().toISOString() } : x));
      toast.success('Als benachrichtigt markiert');
    } catch {
      toast.error('Fehler');
    }
  };

  const filtered = entries.filter(e => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      e.firstName.toLowerCase().includes(q) ||
      e.lastName.toLowerCase().includes(q)  ||
      e.email.toLowerCase().includes(q)     ||
      e.serviceName?.toLowerCase().includes(q)
    );
  });

  const pending   = entries.filter(e => e.status === 'Pending').length;
  const notified  = entries.filter(e => e.status === 'Notified').length;

  return (
    <div className="min-h-screen bg-[#F7F7F8] p-4 md:p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#6355E4] rounded-2xl flex items-center justify-center">
            <ClipboardList size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#111318]">Warteliste</h1>
            <p className="text-xs text-[#9CA3AF]">Kunden die auf einen freien Termin warten</p>
          </div>
        </div>
        <Button
          size="sm"
          variant="flat"
          className="bg-white border border-[#E5E7EB] text-[#374151]"
          startContent={<RefreshCw size={14} />}
          onPress={load}
          isLoading={loading}
        >
          Aktualisieren
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border border-[#E5E7EB] shadow-sm">
          <CardBody className="p-4">
            <p className="text-2xl font-bold text-[#F59E0B]">{pending}</p>
            <p className="text-xs text-[#9CA3AF] mt-0.5">Wartend</p>
          </CardBody>
        </Card>
        <Card className="border border-[#E5E7EB] shadow-sm">
          <CardBody className="p-4">
            <p className="text-2xl font-bold text-[#6355E4]">{notified}</p>
            <p className="text-xs text-[#9CA3AF] mt-0.5">Benachrichtigt</p>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border border-[#E5E7EB] shadow-sm">
        <CardBody className="p-4">
          <div className="flex flex-wrap gap-3">
            <Input
              placeholder="Name oder E-Mail suchen..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              startContent={<Search size={15} className="text-[#9CA3AF]" />}
              classNames={{ inputWrapper: 'bg-[#F7F7F8] border border-[#E5E7EB]' }}
              className="flex-1 min-w-[180px]"
            />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="border border-[#E5E7EB] bg-[#F7F7F8] rounded-xl px-3 py-2 text-sm text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#6355E4]/25"
            >
              <option value="">Alle Status</option>
              <option value="Pending">Wartend</option>
              <option value="Notified">Benachrichtigt</option>
              <option value="Booked">Gebucht</option>
              <option value="Expired">Abgelaufen</option>
            </select>
            <Input
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              classNames={{ inputWrapper: 'bg-[#F7F7F8] border border-[#E5E7EB]' }}
              className="w-auto"
            />
            {(filterStatus || filterDate || search) && (
              <Button
                size="sm"
                variant="flat"
                className="bg-red-50 text-red-500 border border-red-200"
                startContent={<X size={14} />}
                onPress={() => { setFilterStatus(''); setFilterDate(''); setSearch(''); }}
              >
                Zurücksetzen
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Entries */}
      <Card className="border border-[#E5E7EB] shadow-sm">
        <CardBody className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-[#E5E7EB] border-t-[#6355E4] rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-[#9CA3AF]">
              <ClipboardList className="mx-auto mb-3 text-[#E5E7EB]" size={40} />
              <p className="font-medium text-sm">Keine Einträge gefunden</p>
            </div>
          ) : (
            <div className="divide-y divide-[#F3F4F6]">
              {filtered.map(entry => (
                <div key={entry.id} className="p-4 flex items-start gap-4 hover:bg-[#F7F7F8] transition-colors">

                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-[#6355E4]/10 flex items-center justify-center shrink-0">
                    <span className="text-[#6355E4] font-bold text-sm">
                      {entry.firstName.charAt(0)}{entry.lastName.charAt(0)}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-[#111318] text-sm">
                        {entry.firstName} {entry.lastName}
                      </p>
                      <Chip
                        size="sm"
                        color={STATUS_COLOR[entry.status] ?? 'default'}
                        variant="flat"
                        className="text-xs"
                      >
                        {STATUS_LABEL[entry.status] ?? entry.status}
                      </Chip>
                    </div>

                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#6B7280]">
                      {entry.email && (
                        <span className="flex items-center gap-1">
                          <Mail size={11} />
                          <a href={`mailto:${entry.email}`} className="hover:text-[#6355E4]">{entry.email}</a>
                        </span>
                      )}
                      {entry.phone && (
                        <span className="flex items-center gap-1">
                          <Phone size={11} />
                          <a href={`tel:${entry.phone}`} className="hover:text-[#6355E4]">{entry.phone}</a>
                        </span>
                      )}
                      {entry.serviceName && (
                        <span className="flex items-center gap-1">
                          <User size={11} />{entry.serviceName}
                        </span>
                      )}
                      {entry.preferredDate && (
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />
                          {new Date(entry.preferredDate).toLocaleDateString('de-DE')}
                        </span>
                      )}
                    </div>

                    {entry.notes && (
                      <p className="mt-1.5 text-xs text-[#9CA3AF] italic">"{entry.notes}"</p>
                    )}

                    <p className="mt-1 text-[10px] text-[#D1D5DB]">
                      Eingetragen: {new Date(entry.createdAt).toLocaleString('de-DE')}
                      {entry.notifiedAt && ` · Benachrichtigt: ${new Date(entry.notifiedAt).toLocaleString('de-DE')}`}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {entry.status === 'Pending' && (
                      <Button
                        size="sm"
                        variant="flat"
                        className="bg-[#EEEBFC] text-[#6355E4] border border-[#C7D2FE] text-xs"
                        startContent={<Bell size={12} />}
                        onPress={() => handleMarkNotified(entry.id)}
                      >
                        Notiert
                      </Button>
                    )}
                    <Button
                      size="sm"
                      isIconOnly
                      variant="flat"
                      className="bg-red-50 text-red-500 hover:bg-red-100"
                      isLoading={deleting === entry.id}
                      onPress={() => handleDelete(entry.id)}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

    </div>
  );
}
