# Architektur

## Überblick

Single-Repo-Next.js-App (App-Router, TypeScript) mit PostgreSQL als
Datenbank, Prisma als ORM, jose für signierte JWT-Session-Cookies und
bcryptjs für die Passwort-Hashing.

```
Browser ──HTTP──> Next.js (App Router)
                    │
                    ├── Pages (Server Components)
                    ├── API-Routen (Route Handlers)
                    └── Server Actions (z. B. Logout-Form)
                          │
                          ▼
                    Prisma Client ──> PostgreSQL
```

## Authentifizierung

- Registrierung: `POST /api/auth/register` → bcrypt-Hash (Cost 10) →
  User anlegen → Jose-JWT (HS256) signieren → httpOnly-Cookie setzen.
- Anmeldung: `POST /api/auth/login` → User suchen → `bcrypt.compare` →
  JWT-Cookie.
- Abmeldung: `POST /api/auth/logout` → Cookie löschen (maxAge 0).
- Aktuelle Sitzung: `src/lib/session.ts` liest Cookie verifiziert das JWT
  und liefert `{ sub, email, name }` an Server Components.

Es gibt **keine** Passwort-Reset- oder E-Mail-Verifizierungsfunktion – die
App ist ein Lernwerkzeug, kein produktives Produkt. Das Session-Geheimnis
liegt in `JWT_SECRET` (bzw. `NEXTAUTH_SECRET`).

## Spaced Repetition (SM-2)

Implementiert als reine Funktionen in `src/lib/sm2.ts`. Der Algorithmus
folgt der klassischen SM-2-Variante mit vier UI-Grades
(`again / hard / good / easy`), gemappt auf SM-2-Qualitäten
(`1 / 3 / 4 / 5`).

| Grade | Repetitionen | Intervalldauer |
|---|---|---|
| again | zurück auf 0 | 0 (heute erneut) |
| good | +1 | 1 → 6 → `prev × EF` |
| hard | +1 | wie good, aber Ease-Faktor sinkt |
| easy | +1 | wie good, aber Ease-Faktor steigt |

Ease-Faktor startet bei 2.5 und wird je Bewertung angepasst, nach unten
begrenzt durch `SM2_DEFAULTS.easeFloor = 1.3`.

Pro (User, Frage) existiert genau ein `Review`-Datensatz mit
`easeFactor`, `intervalDays`, `repetitions`, `lapses`, `dueAt`,
`lastReviewedAt`.

## Datenmodell (Prisma)

- `User`: `id`, `email` (unique), `name`, `passwordHash`, Zeitstempel.
- `Question`: `id` = Fragenkatalog-Slug (stabil), `chapter`,
  `chapterTitle`, `question`, `answer`, `sourceRef`. Wird per
  `prisma/seed.ts` idempotent geseedt (`upsert`).
- `Review`: SM-2-Zustand pro User/Question, Unique-Constraint auf
  `(userId, questionId)`, Index auf `(userId, dueAt)` für schnelle
  „fällig"-Abfragen.

## Frage-Auswahl

- `/api/review/next`: liefert zuerst die älteste fällige Karte (höchste
  `lapses` zuerst), sonst die nächste noch nie gelernte Frage, sonst
  `null` („für heute erledigt").
- `/api/review/submit`: schreibt den neuen SM-2-Zustand via `upsert`.

## Design

Tokens aus `DESIGN.md` (Atlassian-Vorlage) sind in
`src/lib/design-tokens.ts` und als CSS-Variablen in
`src/app/globals.css` abgebildet. Eine primäre Aktion pro Fold
(`#1868db`, Pill-Radius `10000px`), weiße Karten mit `1px`-Hairline,
Charlie-/Inter-Schriftschnitt. Keine dritte Schrift, keine dekorativen
Farben außer dem Chart-Set für Status.