-- Question.courseId bekommt ON DELETE CASCADE: Löschen eines Kurses löscht
-- damit seine Fragen und über deren bestehende Cascade-Relationen auch
-- Reviews/ReviewEvents.
ALTER TABLE "Question" DROP CONSTRAINT "Question_courseId_fkey";
ALTER TABLE "Question" ADD CONSTRAINT "Question_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE;
