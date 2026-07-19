-- Migration 0016: Hochladbare Kursbilder (Phase E4). Bytes direkt in der
-- Datenbank (kein Dateisystem nötig, pg_dump-sicher); Auslieferung über
-- /api/courses/[id]/image. Nullable – Kurse ohne Bild zeigen Platzhalter.

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "imageData" BYTEA,
ADD COLUMN     "imageMime" TEXT;
