-- Migration 0015: Explizite Reihenfolge von Fragen innerhalb eines Kapitels
-- (Curriculum-Builder). Bestandsfragen starten mit 0 – ihre Anzeigereihenfolge
-- bleibt dadurch unverändert (Sekundärsortierung nach id).

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;
