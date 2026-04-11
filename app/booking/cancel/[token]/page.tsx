'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, CheckCircle, AlertTriangle, Calendar, Clock, Sparkles, ArrowLeft } from 'lucide-react';

interface BookingPreview {
  alreadyCancelled: boolean;
  message?: string;
  bookingNumber?: string;
  serviceName?: string;
  bookingDate?: string;
  startTime?: string;
  endTime?: string;
  customerName?: string;
}

type State = 'loading' | 'preview' | 'confirming' | 'cancelled' | 'already_cancelled' | 'error';

const PRIMARY = '#E8C7C3';

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const slideUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 22 } },
};

export default function CancelBookingPage() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<State>('loading');
  const [preview, setPreview] = useState<BookingPreview | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const apiBase = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!token) return;
    fetch(`${apiBase}/api/bookings/cancel/preview/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setErrorMessage(data.message ?? 'Ungültiger Stornierungslink.');
          setState('error');
          return;
        }
        setPreview(data);
        setState(data.alreadyCancelled ? 'already_cancelled' : 'preview');
      })
      .catch(() => {
        setErrorMessage('Verbindungsfehler. Bitte versuche es erneut.');
        setState('error');
      });
  }, [token, apiBase]);

  const handleConfirmCancel = async () => {
    setState('confirming');
    try {
      const res = await fetch(`${apiBase}/api/bookings/cancel/${token}`);
      if (res.ok || res.redirected) {
        setState('cancelled');
      } else {
        setErrorMessage('Stornierung fehlgeschlagen. Bitte kontaktiere uns direkt.');
        setState('error');
      }
    } catch {
      setState('cancelled');
    }
  };

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F5EDEB] to-white flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: `${PRIMARY} transparent ${PRIMARY} ${PRIMARY}` }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5EDEB] to-white flex items-center justify-center p-5">
      <AnimatePresence mode="wait">

        {/* Error */}
        {state === 'error' && (
          <motion.div key="error"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center"
          >
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={28} className="text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-[#1E1E1E] mb-2">Ungültiger Link</h1>
            <p className="text-[#8A8A8A] mb-6 text-sm">{errorMessage}</p>
            <a href="mailto:support@gentlegroup.de"
              className="inline-block bg-[#1E1E1E] text-white px-6 py-3 rounded-xl font-medium text-sm hover:bg-[#333] transition-colors">
              Support kontaktieren
            </a>
          </motion.div>
        )}

        {/* Already cancelled */}
        {state === 'already_cancelled' && (
          <motion.div key="already"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <XCircle size={28} className="text-gray-400" />
            </div>
            <h1 className="text-xl font-bold text-[#1E1E1E] mb-2">Bereits storniert</h1>
            <p className="text-[#8A8A8A] text-sm">Diese Buchung wurde bereits storniert.</p>
          </motion.div>
        )}

        {/* Success */}
        {state === 'cancelled' && (
          <motion.div key="cancelled"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            {/* Header */}
            <div className="px-8 pt-8 pb-6 text-center" style={{ background: `linear-gradient(135deg, #6bcb84, #4caf67)` }}>
              <div className="w-16 h-16 bg-white/25 rounded-full flex items-center justify-center mx-auto mb-3 border-4 border-white/40">
                <CheckCircle size={32} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Buchung storniert</h1>
              {preview?.bookingNumber && (
                <p className="text-white/65 text-xs mt-1">#{preview.bookingNumber}</p>
              )}
            </div>
            <div className="p-6 text-center">
              <p className="text-[#8A8A8A] text-sm mb-1">Deine Buchung wurde erfolgreich storniert.</p>
              <p className="text-xs text-[#8A8A8A]">Du erhältst eine Bestätigungs-E-Mail.</p>
            </div>
          </motion.div>
        )}

        {/* Preview / Confirming */}
        {(state === 'preview' || state === 'confirming') && (
          <motion.div key="preview"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            {/* Header */}
            <div className="px-8 pt-8 pb-6 text-center" style={{ background: `linear-gradient(135deg, ${PRIMARY}, #D8B0AC)` }}>
              <div className="w-16 h-16 bg-white/25 rounded-full flex items-center justify-center mx-auto mb-3 border-4 border-white/40">
                <Sparkles size={28} className="text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">Termin stornieren</h1>
              <p className="text-white/65 text-sm mt-1">Möchtest du diesen Termin wirklich stornieren?</p>
            </div>

            <div className="p-6">
              {preview && (
                <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-3 mb-5">
                  {preview.bookingNumber && (
                    <motion.p variants={slideUp} className="text-xs text-[#8A8A8A] text-center">
                      Buchungsnummer: <span className="font-semibold text-[#1E1E1E]">{preview.bookingNumber}</span>
                    </motion.p>
                  )}
                  {preview.serviceName && (
                    <motion.div variants={slideUp} className="flex items-center gap-3 bg-[#F5EDEB] rounded-2xl p-3.5">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: PRIMARY }}>
                        <CheckCircle size={14} className="text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-[#8A8A8A]">Leistung</p>
                        <p className="font-semibold text-[#1E1E1E] text-sm">{preview.serviceName}</p>
                      </div>
                    </motion.div>
                  )}
                  {preview.bookingDate && (
                    <motion.div variants={slideUp} className="flex items-center gap-3 bg-[#F5EDEB] rounded-2xl p-3.5">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: PRIMARY }}>
                        <Calendar size={14} className="text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-[#8A8A8A]">Datum</p>
                        <p className="font-semibold text-[#1E1E1E] text-sm">{preview.bookingDate}</p>
                      </div>
                    </motion.div>
                  )}
                  {preview.startTime && (
                    <motion.div variants={slideUp} className="flex items-center gap-3 bg-[#F5EDEB] rounded-2xl p-3.5">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: PRIMARY }}>
                        <Clock size={14} className="text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-[#8A8A8A]">Uhrzeit</p>
                        <p className="font-semibold text-[#1E1E1E] text-sm">{preview.startTime} – {preview.endTime} Uhr</p>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              <div className="flex flex-col gap-2.5">
                <motion.button
                  onClick={handleConfirmCancel}
                  disabled={state === 'confirming'}
                  whileHover={{ scale: state !== 'confirming' ? 1.01 : 1 }}
                  whileTap={{ scale: state !== 'confirming' ? 0.97 : 1 }}
                  className="w-full flex items-center justify-center gap-2 bg-red-500 text-white px-6 py-3.5 rounded-2xl font-semibold text-sm hover:bg-red-600 transition-colors disabled:opacity-60 shadow-lg shadow-red-200"
                >
                  {state === 'confirming' ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Wird storniert…
                    </>
                  ) : (
                    <><XCircle size={16} /> Ja, Termin stornieren</>
                  )}
                </motion.button>
                <button
                  onClick={() => window.history.back()}
                  className="w-full flex items-center justify-center gap-1.5 text-sm text-[#8A8A8A] hover:text-[#1E1E1E] transition-colors py-2"
                >
                  <ArrowLeft size={14} /> Abbrechen
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
