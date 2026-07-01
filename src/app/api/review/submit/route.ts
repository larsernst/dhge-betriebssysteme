import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { applySm2, SM2_DEFAULTS, type ReviewGrade } from "@/lib/sm2";

const schema = z.object({
  questionId: z.string().min(1),
  grade: z.enum(["again", "hard", "good", "easy"]),
  isNew: z.boolean().optional(),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Eingabe ungültig." }, { status: 400 });
  }
  const { questionId, grade, isNew } = parsed.data;

  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question) {
    return NextResponse.json({ error: "Frage nicht gefunden." }, { status: 404 });
  }

  const existing = await prisma.review.findUnique({
    where: { userId_questionId: { userId: user.sub, questionId } },
  });

  const prevState = existing
    ? {
        easeFactor: existing.easeFactor,
        intervalDays: existing.intervalDays,
        repetitions: existing.repetitions,
        lapses: existing.lapses,
        dueAt: existing.dueAt,
        lastReviewedAt: existing.lastReviewedAt,
      }
    : {
        easeFactor: SM2_DEFAULTS.easeFactor,
        intervalDays: SM2_DEFAULTS.intervalDays,
        repetitions: SM2_DEFAULTS.repetitions,
        lapses: SM2_DEFAULTS.lapses,
        dueAt: new Date(),
        lastReviewedAt: null,
      };

  const next = applySm2(prevState, grade as ReviewGrade, new Date());

  const updated = await prisma.review.upsert({
    where: { userId_questionId: { userId: user.sub, questionId } },
    create: {
      userId: user.sub,
      questionId,
      easeFactor: next.easeFactor,
      intervalDays: next.intervalDays,
      repetitions: next.repetitions,
      lapses: next.lapses,
      dueAt: next.dueAt,
      lastReviewedAt: next.lastReviewedAt,
    },
    update: {
      easeFactor: next.easeFactor,
      intervalDays: next.intervalDays,
      repetitions: next.repetitions,
      lapses: next.lapses,
      dueAt: next.dueAt,
      lastReviewedAt: next.lastReviewedAt,
    },
  });

  return NextResponse.json({
    ok: true,
    review: updated,
    isNew: isNew ?? !existing,
    nextDue: next.dueAt,
    intervalDays: next.intervalDays,
  });
}