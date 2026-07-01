-- Migration 0004: Pro-User-Einstellung zum (De-)Aktivieren von Multiple-Choice
ALTER TABLE "User" ADD COLUMN "mcqEnabled" BOOLEAN NOT NULL DEFAULT TRUE;