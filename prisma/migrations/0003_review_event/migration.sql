-- Migration 0003: ReviewEvent (pro Versuch) fuer Statistik/Streak/Heatmap
CREATE TABLE "ReviewEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "mcqCorrect" BOOLEAN,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ReviewEvent_userId_at_idx" ON "ReviewEvent"("userId", "at");
CREATE INDEX "ReviewEvent_userId_questionId_idx" ON "ReviewEvent"("userId", "questionId");

ALTER TABLE "ReviewEvent"
  ADD CONSTRAINT "ReviewEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReviewEvent"
  ADD CONSTRAINT "ReviewEvent_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;