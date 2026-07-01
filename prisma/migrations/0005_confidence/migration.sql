-- Migration 0005: Vertrauensstufe fuer Antworten (Content Review)
ALTER TABLE "Question" ADD COLUMN "confidence" TEXT;