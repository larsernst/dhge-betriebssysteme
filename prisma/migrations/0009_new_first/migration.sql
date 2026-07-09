-- Migration 0009: Pro-User-Einstellung "Neue Fragen zuerst lernen"
ALTER TABLE "User" ADD COLUMN "newQuestionsFirst" BOOLEAN NOT NULL DEFAULT TRUE;
