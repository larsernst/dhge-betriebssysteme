-- Migration 0002: Multiple-Choice-Optionen fuer "Nenne ..."-Fragen
ALTER TABLE "Question" ADD COLUMN "mcqOptions" JSONB;