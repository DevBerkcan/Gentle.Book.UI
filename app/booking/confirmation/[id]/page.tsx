// app/booking/confirmation/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Calendar, Clock, Sparkles, Mail, Phone, User } from "lucide-react";
import { Button } from "@nextui-org/button";
import Link from "next/link";

interface BookingDetails {
  id: string;
  bookingNumber: string;
  status: string;
  booking: {
    serviceName: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
    price: number;
  };
  customer: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function ConfirmationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBooking() {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL;
        if (!API_URL) throw new Error('NEXT_PUBLIC_API_URL is not configured');
        const response = await fetch(`${API_URL}/bookings/${params.id}`);
        if (!response.ok) throw new Error("Buchung nicht gefunden");
        const data = await response.json();
        setBooking(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadBooking();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-barber-cream to-barber-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-barber-red" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-barber-cream to-barber-white flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold text-barber-black mb-2">Fehler</h1>
          <p className="text-barber-grey-600 mb-6">Buchung konnte nicht geladen werden</p>
          <Link href="/">
            <Button className="bg-barber-red text-white">Zur Startseite</Button>
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('de-DE', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5EDEB] to-white">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-[#E8C7C3] to-[#D8B0AC] text-white p-8 text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-[#E8C7C3]" size={48} />
            </div>
            <h1 className="text-3xl font-bold mb-2">Termin bestätigt!</h1>
            <p className="text-white/90">Buchungsnummer: {booking.bookingNumber}</p>
          </div>

          <div className="p-8 space-y-6">
            <div className="bg-[#F5EDEB] rounded-xl p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#E8C7C3]/10 rounded-lg flex items-center justify-center">
                  <Calendar className="text-[#E8C7C3]" size={20} />
                </div>
                <div>
                  <p className="text-sm text-[#8A8A8A] mb-1">Datum & Uhrzeit</p>
                  <p className="font-semibold text-[#1E1E1E]">{formatDate(booking.booking.bookingDate)}</p>
                  <p className="text-[#6B6B6B]">{booking.booking.startTime} - {booking.booking.endTime} Uhr</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#E8C7C3]/10 rounded-lg flex items-center justify-center">
                  <Sparkles className="text-[#E8C7C3]" size={20} />
                </div>
                <div>
                  <p className="text-sm text-[#8A8A8A] mb-1">Leistung</p>
                  <p className="font-semibold text-[#1E1E1E]">{booking.booking.serviceName}</p>
                  <p className="text-[#6B6B6B]">{booking.booking.price.toFixed(2)} CHF</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#E8C7C3]/10 rounded-lg flex items-center justify-center">
                  <User className="text-[#E8C7C3]" size={20} />
                </div>
                <div>
                  <p className="text-sm text-[#8A8A8A] mb-1">Kunde</p>
                  <p className="font-semibold text-[#1E1E1E]">{booking.customer.firstName} {booking.customer.lastName}</p>
                  <div className="flex items-center gap-2 text-sm text-[#6B6B6B]">
                    <Mail size={14} /> {booking.customer.email}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#F5EDEB] border-2 border-[#E8C7C3] rounded-xl p-4">
              <p className="text-sm text-[#1E1E1E] flex items-start gap-2">
                <Mail className="flex-shrink-0 mt-0.5 text-[#E8C7C3]" size={16} />
                <span>Eine Bestätigung wurde an <strong>{booking.customer.email}</strong> gesendet.</span>
              </p>
            </div>

            <div className="pt-4">
              <Link href="/">
                <Button className="w-full bg-[#E8C7C3] text-white">Zur Startseite</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}