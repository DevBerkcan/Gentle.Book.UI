'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, CheckCircle, AlertTriangle, Sparkles } from 'lucide-react';
import { supportConfig } from '@/lib/config';

interface ReviewPreview {
  alreadyReviewed: boolean;
  serviceName: string;
  tenantName: string;
  bookingDate: string;
}

type State = 'loading' | 'form' | 'submitting' | 'submitted' | 'already_reviewed' | 'error';

const PRIMARY = '#ECEBF2';

export default function ReviewPage() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<State>('loading');
  const [preview, setPreview] = useState<ReviewPreview | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  const apiBase = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!token) return;
    fetch(`${apiBase}/reviews/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setErrorMessage(data.message ?? 'Ungültiger Bewertungslink.');
          setState('error');
          return;
        }
        setPreview(data);
        setState(data.alreadyReviewed ? 'already_reviewed' : 'form');
      })
      .catch(() => {
        setErrorMessage('Verbindungsfehler. Bitte versuche es erneut.');
        setState('error');
      });
  }, [token, apiBase]);

  const handleSubmit = async () => {
    if (rating < 1) return;
    setState('submitting');
    try {
      const res = await fetch(`${apiBase}/reviews/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment: comment.trim() || null }),
      });
      if (res.ok) {
        setState('submitted');
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMessage(data.message ?? 'Bewertung fehlgeschlagen. Bitte versuche es erneut.');
        setState('error');
      }
    } catch {
      setErrorMessage('Verbindungsfehler. Bitte versuche es erneut.');
      setState('error');
    }
  };

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F6F5FA] to-white flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: `${PRIMARY} transparent ${PRIMARY} ${PRIMARY}` }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F6F5FA] to-white flex items-center justify-center p-5">
      <AnimatePresence mode="wait">

        {state === 'error' && (
          <motion.div key="error"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center"
          >
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={28} className="text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-[#14162B] mb-2">Ungültiger Link</h1>
            <p className="text-[#8A8A8A] mb-6 text-sm">{errorMessage}</p>
            <a href={supportConfig.mailto('Problem mit Bewertungslink')}
              className="inline-block bg-[#14162B] text-white px-6 py-3 rounded-xl font-medium text-sm hover:bg-[#333] transition-colors">
              Support kontaktieren
            </a>
          </motion.div>
        )}

        {state === 'already_reviewed' && (
          <motion.div key="already"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={28} className="text-gray-400" />
            </div>
            <h1 className="text-xl font-bold text-[#14162B] mb-2">Bereits bewertet</h1>
            <p className="text-[#8A8A8A] text-sm">Du hast diesen Termin bereits bewertet. Vielen Dank!</p>
          </motion.div>
        )}

        {state === 'submitted' && (
          <motion.div key="submitted"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            <div className="px-8 pt-8 pb-6 text-center" style={{ background: 'linear-gradient(135deg, #6bcb84, #4caf67)' }}>
              <div className="w-16 h-16 bg-white/25 rounded-full flex items-center justify-center mx-auto mb-3 border-4 border-white/40">
                <CheckCircle size={32} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Vielen Dank!</h1>
            </div>
            <div className="p-6 text-center">
              <p className="text-[#8A8A8A] text-sm">Deine Bewertung wurde erfolgreich übermittelt.</p>
            </div>
          </motion.div>
        )}

        {(state === 'form' || state === 'submitting') && preview && (
          <motion.div key="form"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            <div className="px-8 pt-8 pb-6 text-center" style={{ background: `linear-gradient(135deg, ${PRIMARY}, #D8D7E2)` }}>
              <div className="w-16 h-16 bg-white/25 rounded-full flex items-center justify-center mx-auto mb-3 border-4 border-white/40">
                <Sparkles size={28} className="text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">Wie war dein Termin?</h1>
              <p className="text-white/65 text-sm mt-1">
                {preview.serviceName} bei {preview.tenantName}
              </p>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-center gap-1.5 mb-5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1"
                  >
                    <Star
                      size={34}
                      className={(hoverRating || rating) >= star ? 'text-amber-400' : 'text-gray-200'}
                      fill={(hoverRating || rating) >= star ? 'currentColor' : 'none'}
                    />
                  </button>
                ))}
              </div>

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Möchtest du uns noch etwas mitteilen? (optional)"
                rows={3}
                className="w-full bg-[#F6F5FA] rounded-2xl p-3.5 text-sm text-[#14162B] placeholder:text-[#8A8A8A] outline-none focus:ring-2 focus:ring-[#D8D7E2] resize-none mb-5"
              />

              <motion.button
                onClick={handleSubmit}
                disabled={rating < 1 || state === 'submitting'}
                whileHover={{ scale: rating >= 1 && state !== 'submitting' ? 1.01 : 1 }}
                whileTap={{ scale: rating >= 1 && state !== 'submitting' ? 0.97 : 1 }}
                className="w-full flex items-center justify-center gap-2 bg-[#14162B] text-white px-6 py-3.5 rounded-2xl font-semibold text-sm hover:bg-[#333] transition-colors disabled:opacity-40"
              >
                {state === 'submitting' ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Wird gesendet…
                  </>
                ) : (
                  'Bewertung absenden'
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
