import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { applySm2, isMcqCorrect, mcqGrade, SM2_DEFAULTS, type ReviewGrade } from "@/lib/sm2";
import type { McqOption } from "@/lib/types";

const schema = z
  .object({
    questionId: z.string().min(1),
    grade: z.enum(["again", "hard", "good", "easy"]).optional(),
    selectedOptionIds: z.array(z.string()).optional(),
    isNew: z.boolean().optional(),
  })
  .refine((v) => v.grade !== undefined || v.selectedOptionIds !== undefined, {
    message: "Entweder 'grade' (Freie Erinnerung) oder 'selectedOptionIds' (MCQ) erforderlich.",
  });

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Eingabe ungültig.", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const { questionId, grade, selectedOptionIds, isNew } = parsed.data;

  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question) {
    return NextResponse.json({ error: "Frage nicht gefunden." }, { status: 404 });
  }

  let resolvedGrade: ReviewGrade;
  let mcqCorrect: boolean | null = null;
  let correctOptionIds: string[] | null = null;

  if (selectedOptionIds) {
    const options = Array.isArray(question.mcqOptions)
      ? (question.mcqOptions as unknown as McqOption[])
      : [];
    correctOptionIds = options.filter((o) => o.correct).map((o) => o.id);
    mcqCorrect = isMcqCorrect(selectedOptionIds, correctOptionIds);
    resolvedGrade = mcqGrade(mcqCorrect);
  } else {
    resolvedGrade = grade!;
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

  const next = applySm2(prevState, resolvedGrade, new Date());

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

  await prisma.reviewEvent.create({
    data: {
      userId: user.sub,
      questionId,
      grade: resolvedGrade,
      mcqCorrect: mcqCorrect,
    },
  });

  return NextResponse.json({
    ok: true,
    review: updated,
    isNew: isNew ?? !existing,
    mode: selectedOptionIds ? ("mcq" as const) : ("recall" as const),
    mcqCorrect,
    correctOptionIds,
    nextDue: next.dueAt,
    intervalDays: next.intervalDays,
  });
}