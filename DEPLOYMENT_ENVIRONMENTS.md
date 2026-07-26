# GentleBook-Umgebungen

## Zielbild

| Umgebung | Git | Frontend | API | Datenbank |
|---|---|---|---|---|
| Development | lokaler Arbeitsstand | `http://localhost:3000` | `http://localhost:5000/api` | lokale Entwickler-DB |
| Preview | Feature-Branch / Pull Request | automatisch von Vercel | Staging-API | Staging-DB |
| Staging | Branch `staging` | `https://staging.gentlebook.app` | `https://api-staging.gentlebook.app/api` | eigene Staging-DB |
| Production | Branch `main` | `https://app.gentlebook.app` | `https://api.gentlebook.app/api` | Production-DB |

Staging darf niemals die Production-Datenbank oder Live-Zahlungsschlüssel verwenden.

## Vercel einrichten

1. Das bestehende GentleBook-UI-Projekt in Vercel öffnen.
2. Unter **Settings → Environments** eine Custom Environment `staging`
   erstellen.
3. Als Branch-Matcher `equals: staging` konfigurieren.
4. Die Domain `staging.gentlebook.app` nur dieser Umgebung zuordnen.
5. Unter **Settings → Environment Variables** mindestens diese Werte getrennt
   pflegen:

| Variable | Development | Staging | Production |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000/api` | `https://api-staging.gentlebook.app/api` | `https://api.gentlebook.app/api` |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | `https://staging.gentlebook.app` | `https://app.gentlebook.app` |
| `NEXT_PUBLIC_PLATFORM_NAME` | `GentleBook Dev` | `GentleBook Staging` | `GentleBook` |

Analytics- und Consent-IDs sollten in Staging leer bleiben oder auf eigene
Test-Properties zeigen.

Vercel unterstützt Custom Environments mit eigenem Branch-Matcher, eigener
Domain und eigenen Environment Variables. Ein Deployment kann über die CLI
gezielt ausgelöst werden:

```bash
vercel deploy --target=staging
```

Falls der verwendete Vercel-Account keine Custom Environment zulässt, wird
stattdessen ein separates Projekt `gentle-book-ui-staging` mit dem Production
Branch `staging` angelegt. Dadurch bleiben URL und Variablen ebenfalls stabil
und vollständig von Production getrennt.

## Git-Ablauf

```text
feature/*  -> Pull Request -> staging -> Abnahme -> Pull Request -> main
```

- Pushes auf Feature-Branches erzeugen kurzlebige Preview Deployments.
- Pushes auf `staging` aktualisieren nur Staging.
- Nur ein Merge nach `main` aktualisiert Production.
- `main` und `staging` sollten in GitHub geschützt werden; direkte Pushes sind
  zu sperren und ein erfolgreicher Vercel-Build ist als Merge-Check zu verlangen.

Den `staging`-Branch erst aus einem geprüften Commit erzeugen:

```bash
git switch main
git pull --ff-only
git switch -c staging
git push -u origin staging
```

## API und Datenbank

Die API läuft als .NET-Anwendung außerhalb von Vercel und benötigt ein eigenes
Staging-Deployment. Dort muss `ASPNETCORE_ENVIRONMENT=Staging` gesetzt werden.
Konfigurationsschlüssel aus JSON werden in Umgebungsvariablen mit `__`
geschrieben, zum Beispiel:

```text
ConnectionStrings__DefaultConnection
Jwt__Secret
Jwt__Issuer
Jwt__Audience
Jwt__SuperAdminSecret
Jwt__SuperAdminIssuer
Jwt__SuperAdminAudience
Email__BaseUrl
Email__FrontendUrl
Mollie__ApiKey
Mollie__WebhookUrl
Mollie__RedirectUrlBase
Cors__AllowedOrigins__0
```

Für Staging gelten insbesondere:

- separate SQL-Datenbank, z. B. `gentlebook_staging`
- eigene JWT-Secrets
- `Cors__AllowedOrigins__0=https://staging.gentlebook.app`
- Mail-Sandbox oder Test-Empfänger statt echter Kunden
- Mollie-Testschlüssel (`test_...`) und Staging-Webhook
- getrennte CRM-Testinstanz oder deaktivierte CRM-Synchronisierung

Nach dem API-Deployment zuerst `GET /health`, Anmeldung, Testbuchung,
E-Mail-Versand und Mollie-Testzahlung prüfen. Erst danach nach `main` mergen.

## Lokale Entwicklung

```bash
copy .env.example .env.local
npm install
npm run dev
```

`.env.local`, Vercel-Metadaten und alle Dateien mit echten Secrets bleiben
ignoriert und werden nicht committed.

Das Projekt ist für Vercel auf Node.js 22 festgelegt. Dadurch verwenden
Development, Staging und Production dieselbe Runtime und Next.js 14 wird nicht
versehentlich mit einer inkompatiblen lokalen Node.js-24-Runtime gebaut.
