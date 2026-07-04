-- Migration 0007: Rollen-basierte Admin-Autorisierung.
-- Additiv: neue Tabelle "UserRole" fuer mehrere Rollen pro Nutzer (z. B. "admin").
-- Bestehende Nutzer bleiben unberuehrt und haben zunaechst keine Rolle
-- (d. h. niemand ist Admin, bis der erste per `npm run db:make-admin` ernannt wird).

CREATE TABLE "UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserRole_userId_role_key" ON "UserRole"("userId", "role");

CREATE INDEX "UserRole_userId_idx" ON "UserRole"("userId");

ALTER TABLE "UserRole"
  ADD CONSTRAINT "UserRole_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
