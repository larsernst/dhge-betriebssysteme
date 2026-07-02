# Testing

Die App hat zwei Test-Schichten: **Unit-Tests** (Vitest, rein logisch) und
**End-to-End-Tests** (Playwright, gegen die laufende App + Datenbank).

## Unit-Tests (Vitest)

Gedeckter Bereich:

| Datei | Getestetes Verhalten |
|---|---|
| `tests/unit/sm2.test.ts` | SM-2-Fortschreibung, Intervalldauer, Ease-Faktor-Boden, „again"-Reset, Fälligkeit |
| `tests/unit/password.test.ts` | bcryptjs Hash/Verify, Salt-Eindeutigkeit |
| `tests/unit/session.test.ts` | Jose-JWT Round-Trip und Token-Manipulation |

Ausführen (keine Datenbank erforderlich):

```bash
npm install
npm run test:unit
# oder mit Abdeckung:
npx vitest run --coverage
```

## End-to-End-Tests (Playwright)

Der E2E-Test prüft den vollständigen Lernfluss: Registrierung → Frage wird
angezeigt → Musterantwort aufdecken → mit „Good" bewerten → nächste Karte
erscheint → Fortschrittsseite zeigt Statistik.

Voraussetzung: App und Datenbank laufen. Einfach via Docker:

```bash
docker compose up --build -d
# einmal initialisieren lassen, dann:
BASE_URL=http://<your-host>:<port> npm run test:e2e
```

Für CI kann ein eigener Test-Stack hochgefahren werden (z. B. mit separatem
`TEST_DATABASE_URL`). Die Tests verwenden pro Lauf eine eindeutige E-Mail,
sodass sie wiederholbar sind.

## Test-freundliche Architektur

- SM-2 ist als reine Funktionen in `src/lib/sm2.ts` implementiert (keine
  Nebeneffekte, Zeit steuerbar via Parameter), daher ohne Datenbank testbar.
- Passwort- und Session-Logik sind isoliert nutzbar.
- API-Routen validieren Eingaben mit `zod` und liefern deterministische
  HTTP-Status, was stabile E2E-Assertions erlaubt.