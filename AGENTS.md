# AGENTS.md – Hinweise für KI-Agenten

## Linting / Typechecking / Tests

Vor jedem Commit sind auszuführen:

```bash
npm run typecheck      # tsc --noEmit
npm run test:unit      # Vitest
# E2E nur gegen laufende App+DB:
BASE_URL=http://<your-host>:<port> npm run test:e2e
```

`npm run lint` (`next lint`) ist verfügbar, aber nicht Teil des Pflicht-Checks.

## Architektur-Startpunkte

- SM-2-Logik: `src/lib/sm2.ts` (rein, gut getestet).
- Auth: `src/lib/session.ts` (Jose-JWT), `src/lib/password.ts` (bcryptjs).
- API-Routen: `src/app/api/**/route.ts`.
- Fragenkatalog-Daten: `prisma/seed-data/fragenkatalog.ts` (nur diese Datei
  enthält die 100 Fragen/Antworten).
- Design-Tokens: `src/lib/design-tokens.ts` + `src/app/globals.css`
  (Vorgabe: `DESIGN.md`).

## Konventionen

- Sprache der UI: **Deutsch**.
- Keine Kommentare im Code, außer es wird ausdrücklich gewünscht.
- Neue Fragen/Antworten ausschließlich in `fragenkatalog.ts`pflegen,
  danach `npm run db:seed`.
- Keine Secrets committen; `.env` ist ignoriert.
- `resources/` (Vorlesungsquellen) wird **nicht** committet.