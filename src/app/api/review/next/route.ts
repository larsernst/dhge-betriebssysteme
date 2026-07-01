import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import type { McqOption } from "@/lib/types";

function stripMcq(options: McqOption[]): { id: string; text: string }[] {
  const stripped = options.map((o) => ({ id: o.id, text: o.text }));
  for (let i = stripped.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [stripped[i], stripped[j]] = [stripped[j], stripped[i]];
  }
  return stripped;
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const url = new URL(request.url);
  const difficultOnly = url.searchParams.get("deck") === "difficult";
  const now = new Date();

  const dueReviews = await prisma.review.findMany({
    where: {
      userId: user.sub,
      dueAt: { lte: now },
      ...(difficultOnly ? { lapses: { gte: 1 } } : {}),
    },
    include: { question: true },
    orderBy: [{ lapses: "desc" }, { dueAt: "asc" }],
    take: 1,
  });

  if (dueReviews.length > 0) {
    const r = dueReviews[0];
    return NextResponse.json({
      review: serializeReview(r.question),
      isNew: false,
      deck: difficultOnly ? "difficult" : "all",
    });
  }

  if (difficultOnly) {
    return NextResponse.json({ review: null, isNew: false, deck: "difficult" });
  }

  const learnedQuestionIds = await prisma.review.findMany({
    where: { userId: user.sub },
    select: { questionId: true },
  });
  const learnedIds = new Set(learnedQuestionIds.map((r) => r.questionId));

  const allQuestions = await prisma.question.findMany({ orderBy: [{ chapter: "asc" }, { id: "asc" }] });
  const nextNew = allQuestions.find((q) => !learnedIds.has(q.id));

  if (!nextNew) {
    return NextResponse.json({ review: null, isNew: false, deck: "all" });
  }

  return NextResponse.json({ review: serializeReview(nextNew), isNew: true, deck: "all" });
}

function serializeReview(question: {
  id: string;
  chapter: number;
  chapterTitle: string;
  question: string;
  answer: string;
  sourceRef: string;
  mcqOptions: unknown;
}) {
  const mcq = Array.isArray(question.mcqOptions) ? (question.mcqOptions as McqOption[]) : null;
  return {
    question: {
      id: question.id,
      chapter: question.chapter,
      chapterTitle: question.chapterTitle,
      question: question.question,
      answer: question.answer,
      sourceRef: question.sourceRef,
      mcqOptions: mcq ? stripMcq(mcq) : null,
    },
  };
}