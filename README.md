# 💈 Barber Dario - Buchungssystem

Vollständiges Online-Buchungssystem für Barber Dario mit automatischen Email-Benachrichtigungen, Admin Dashboard und Kunden-Ansicht.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![.NET](https://img.shields.io/badge/.NET-8.0-purple)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## ✨ Features

### 🎯 Kunden-Features
- ✅ **3-Schritt Buchung**: Service → Datum/Zeit → Kontaktdaten
- ✅ **Meine Buchungen**: Alle Termine per Email abrufen
- ✅ **Stornierung**: Einfache Terminstornierung
- ✅ **Email-Benachrichtigungen**:
  - Sofortige Buchungsbestätigung
  - Erinnerung 24h vor Termin
  - Stornierungsbestätigung

### 👨‍💼 Admin-Features
- ✅ **Dashboard**:
  - Tagesübersicht mit allen Terminen
  - Nächster Termin mit Countdown
  - Monatsstatistiken (Buchungen, Umsatz, Kunden)
  - Beliebte Services
- ✅ **Buchungsverwaltung**:
  - Alle Buchungen mit Filter & Suche
  - Status-Update (Pending → Confirmed → Completed)
  - Admin-Notizen
  - Pagination
- ✅ **Passwortschutz**: Einfacher Login-Schutz

### 🔧 Technische Features
- ✅ **Automatische Erinnerungen**: Hangfire Background Jobs (täglich um 9 Uhr)
- ✅ **Email-Logging**: Alle Emails werden geloggt
- ✅ **CORS**: Sicheres API-Setup
- ✅ **Responsive Design**: Optimiert für Desktop & Mobile
- ✅ **Type-Safe**: Volle TypeScript & C# Type-Safety

---

## 🛠 Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- TailwindCSS
- NextUI (UI Components)
- Framer Motion (Animations)

**Backend:**
- .NET 8.0 Web API
- Entity Framework Core 8
- PostgreSQL (Supabase)
- Hangfire (Background Jobs)
- MailKit (Email)
- FluentValidation

**Services:**
- Supabase (PostgreSQL Database)
- Brevo (SMTP Email)
- Vercel (Frontend Hosting)
- Railway (Backend Hosting)

---

## 🚀 Quick Start

### Voraussetzungen
- Node.js 18+
- .NET SDK 8.0+
- PostgreSQL

### 1. Frontend Setup

```bash
cd limktree_keinfriseur

# Dependencies installieren
npm install

# Environment Variable
echo "NEXT_PUBLIC_API_URL=http://localhost:5067/api" > .env.local

# Development Server
npm run dev
```

Frontend läuft auf: http://localhost:3000

### 2. Backend Setup

```bash
cd barberdario-api/BarberDario.Api

# Dependencies installieren
dotnet restore

# appsettings.Development.json konfigurieren
# (siehe appsettings.Development.json)

# Datenbank Migration
dotnet ef database update

# API Server starten
dotnet run
```

Backend läuft auf: http://localhost:5067

---

## 📁 Projekt-Struktur

```
limktree_keinfriseur/               # Frontend (Next.js)
├── app/
│   ├── booking/                    # Buchungsseiten
│   │   ├── page.tsx               # 3-Schritt Wizard
│   │   └── confirmation/[id]/     # Bestätigung
│   ├── my-bookings/               # Kunden-Buchungsansicht
│   ├── admin/
│   │   ├── login/                 # Admin Login
│   │   ├── dashboard/             # Admin Dashboard
│   │   └── bookings/              # Buchungsverwaltung
│   └── layout.tsx
├── components/
│   ├── booking/                   # Booking Components
│   └── admin/                     # Admin Components
├── lib/
│   └── api/                       # API Clients
└── .env.local                     # Environment Variables

barberdario-api/                    # Backend (.NET)
├── BarberDario.Api/
│   ├── Controllers/               # API Endpoints
│   ├── Services/                  # Business Logic
│   │   ├── BookingService.cs
│   │   ├── EmailService.cs
│   │   ├── AdminService.cs
│   │   └── ReminderService.cs
│   ├── Data/
│   │   ├── Entities/              # Database Models
│   │   └── BarberDarioDbContext.cs
│   ├── DTOs/                      # Data Transfer Objects
│   └── Program.cs                 # Startup & Configuration
└── appsettings.json
```

---

## 🔌 API Endpoints

### Public Endpoints

**Services:**
```
GET  /api/services
```

**Availability:**
```
GET  /api/availability/{serviceId}?date=2026-01-15
```

**Bookings:**
```
POST   /api/bookings
GET    /api/bookings/{id}
GET    /api/bookings/by-email/{email}
DELETE /api/bookings/{id}
```

### Admin Endpoints

```
GET   /api/admin/dashboard
GET   /api/admin/statistics
GET   /api/admin/bookings?status=&page=1&pageSize=20
PATCH /api/admin/bookings/{id}/status
```

---

## 📧 Email Templates

Das System versendet 3 Arten von Emails:

1. **Buchungsbestätigung** (sofort nach Buchung)
   - Buchungsdetails (Service, Datum, Zeit)
   - Buchungsnummer
   - Standort-Info

2. **Erinnerung** (24h vor Termin, automatisch um 9 Uhr)
   - Terminerinnerung
   - Alle Details
   - Wichtige Hinweise

3. **Stornierungsbestätigung** (bei Stornierung)
   - Bestätigung der Stornierung
   - Stornierte Buchungsdetails

---

## 🔧 Konfiguration

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5067/api
```

### Backend (appsettings.Development.json)
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=...;Database=postgres;..."
  },
  "Email": {
    "SmtpHost": "smtp-relay.brevo.com",
    "SmtpPort": 587,
    "SmtpUsername": "your-email@example.com",
    "SmtpPassword": "your-smtp-key",
    "SenderEmail": "noreply@barberdario.com",
    "SenderName": "Barber Dario"
  },
  "Cors": {
    "AllowedOrigins": ["http://localhost:3000"]
  }
}
```

---

## 🧪 Testing

### Manuelles Testing

1. **Buchung erstellen**: http://localhost:3000/booking
2. **Buchungen abrufen**: http://localhost:3000/my-bookings
3. **Admin Login**: http://localhost:3000/admin/login
   - Username: `admin`
   - Password: `barber2025`
4. **Hangfire Dashboard**: http://localhost:5067/hangfire

### API Testing

```bash
# Services abrufen
curl http://localhost:5067/api/services

# Verfügbarkeit prüfen
curl http://localhost:5067/api/availability/SERVICE_ID?date=2026-01-15

# Buchung erstellen
curl -X POST http://localhost:5067/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "11111111-1111-1111-1111-111111111111",
    "bookingDate": "2026-01-15",
    "startTime": "14:00",
    "customer": {
      "firstName": "Max",
      "lastName": "Mustermann",
      "email": "max@example.com",
      "phone": "+49123456789"
    }
  }'
```

---

## 📊 Datenbank

**Entities:**
- `Service` - Dienstleistungen
- `Customer` - Kunden
- `Booking` - Buchungen
- `BusinessHours` - Öffnungszeiten
- `BlockedTimeSlots` - Gesperrte Zeiten
- `EmailLog` - Email-Protokoll
- `Setting` - System-Einstellungen

**Seed Data:**
- 4 Services (Herrenschnitt, Bart Trimmen, Komplettpaket, Kinder Haarschnitt)
- Öffnungszeiten (Mo-Fr: 9-20 Uhr, Sa: 9-20 Uhr)
- System-Einstellungen

---

## 🚀 Deployment

Siehe [DEPLOYMENT.md](DEPLOYMENT.md) für vollständige Deployment-Anleitung.

**Quick Summary:**
- Frontend → Vercel
- Backend → Railway
- Database → Supabase (bereits konfiguriert)
- Email → Brevo (bereits konfiguriert)

---

## 🔐 Sicherheit

- ✅ CORS richtig konfiguriert
- ✅ SQL Injection Prevention (EF Core Parametrized Queries)
- ✅ XSS Protection (React Auto-Escaping)
- ✅ Environment Variables für Secrets
- ⚠️ Admin: Einfacher Passwortschutz (LocalStorage)
  - **TODO**: Für Production JWT/NextAuth implementieren

---

## 📝 Weitere Entwicklung

**Mögliche Erweiterungen:**
- [ ] SMS-Benachrichtigungen (Twilio)
- [ ] Kalender-Integration (Google Calendar)
- [ ] Mehrere Barbers/Mitarbeiter
- [ ] Warteliste bei vollen Slots
- [ ] Kundenbewertungen
- [ ] Treuepunkte-System
- [ ] Online-Zahlung (Stripe)
- [ ] Mehrsprachigkeit (i18n)

---

## 📄 Lizenz

Proprietär - Barber Dario

---

## 👨‍💻 Entwickelt von

Entwickelt mit ❤️ für Barber Dario

**Kontakt:**
- Email: berkcan@gentle-webdesign.com
- Website: https://gentle-webdesign.com

---

## 🎉 Status

✅ **Production Ready**

- Alle Features implementiert
- Emails funktionieren (Brevo SMTP)
- Background Jobs aktiv (Hangfire)
- Admin Dashboard fertig
- Responsive Design
- Deployment-Ready

**Live URLs (nach Deployment):**
- Frontend: https://barberdario.vercel.app
- API: https://barberdario-api.railway.app
- Admin: https://barberdario.vercel.app/admin
