
# Dispo App Starter (Next.js + Tailwind + Supabase)

Ein minimaler Starter für deine maßgeschneiderte Dispo-App mit Monats-Board, Ampel-Logik (rot/gelb/blau/grün) und Supabase-Backend.

## 1) Lokal starten
```bash
# im Projektordner
npm install
cp .env.example .env.local
# trage deine Supabase Keys/URL ein (erst in Schritt 2 erstellen)
npm run dev
```
Öffne http://localhost:3000 – du siehst ein Mock-Board.

## 2) Supabase einrichten (gehostetes Postgres + Auth)
1. Gehe zu https://supabase.com/ und erstelle ein Projekt (Free-Plan reicht).
2. Kopiere **Project URL** und **anon key** in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL=...`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
   - `SUPABASE_SERVICE_ROLE_KEY=...` (Service-Role Key findet sich ebenfalls in den Projekt-Einstellungen – kommt in Vercel-Env, nicht ins Browser-Env)
3. Öffne im Supabase-SQL-Editor die Datei `supabase/schema.sql` aus diesem Projekt und führe sie aus.

Optional: eigene RLS-Policies ergänzen (für MVP kannst du mit Admin UI arbeiten).

## 3) Board mit echten Daten verbinden
- Ersetze die Mock-Daten in `app/page.tsx` durch einen Server-Loader oder Client-Fetch via Supabase.
- Datenmodell siehe `supabase/schema.sql`.

## 4) Deploy (Zero-DevOps)
- Erstelle ein GitHub-Repo und pushe dieses Projekt.
- Verbinde das Repo mit **Vercel** (https://vercel.com/new) → „Import Project“.
- Setze in Vercel die **Environment Variables**:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (Server-seitig, **nicht** im Browser)
- Deploy klicken. Fertig.

## 5) Nächste Features
- Tag-Drawer mit Jobliste (von–bis, Dauer-Rundung, Dropdowns).
- Stammdaten-CRUD (Aufgabe/Objekt/Ort/Techniker).
- Farb-Formatierung bleibt wie im Board prototypisch umgesetzt.

## Farb- und Geschäftslogik (Kurz)
- **Rot**: verfügbar & 0 min geplant.
- **Gelb**: 0 < min < Feierabend.
- **Gelb (voll)**: = Feierabend.
- **Gelb (dunkler)**: > Feierabend (Überbuchung).
- **Blau**: krank/urlaub/helfer.
- **Grün**: Freitag ohne Planung (Nachzügler).

Viel Erfolg! ✨
 
