'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Kein Token angegeben.');
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(
          `${API_BASE.replace(/\/api$/, '')}/api/public/verify-email?token=${encodeURIComponent(token)}`
        );
        const data = await res.json();
        if (res.ok) {
          setStatus('success');
          setMessage(data.message ?? 'E-Mail erfolgreich bestätigt.');
        } else {
          setStatus('error');
          setMessage(data.message ?? 'Link ungültig oder abgelaufen.');
        }
      } catch {
        setStatus('error');
        setMessage('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5] p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-br from-[#1a1a1a] via-[#2d2824] to-[#1a1a1a] px-8 py-10 text-center border-b-4 border-[#C09995]">
          <span className="text-[#C09995] text-5xl block mb-3">✧</span>
          <h1 className="text-white text-xl font-semibold">E-Mail bestätigen</h1>
        </div>

        <div className="p-8 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="mx-auto mb-4 text-[#C09995] animate-spin" size={48} />
              <p className="text-slate-600">Wird überprüft…</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="mx-auto mb-4 text-green-500" size={48} />
              <h2 className="text-lg font-semibold text-slate-800 mb-2">Vielen Dank!</h2>
              <p className="text-slate-600 mb-6">{message}</p>
              <p className="text-sm text-slate-400">
                Ihre E-Mail-Adresse wurde bestätigt und Ihre Einwilligung wurde gespeichert.
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="mx-auto mb-4 text-red-400" size={48} />
              <h2 className="text-lg font-semibold text-slate-800 mb-2">Bestätigung fehlgeschlagen</h2>
              <p className="text-slate-600">{message}</p>
            </>
          )}
        </div>

        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#2d2824] px-8 py-5 text-center border-t-4 border-[#C09995]">
          <p className="text-[#a3a3a3] text-xs">
            Buchungssystem powered by GentleBook
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="text-[#C09995] animate-spin" size={40} />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
