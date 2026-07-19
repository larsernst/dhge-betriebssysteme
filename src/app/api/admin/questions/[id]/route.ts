import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireEditorApi, isAdmin } from "@/lib/auth";
import { canEditCourse } from "@/lib/course-access";
import { z } from "zod";

const patchSchema = z.object({
  question: z.string().min(1).optional(),
  answer: z.string().min(1).optional(),
});

async function loadQuestionWithCourse(id: string) {
  const question = await prisma.question.findUnique({
    where: { id },
    select: { id: true, courseId: true, course: { select: { id: true, ownerId: true, status: true } } },
  });
  return question;
}

function canEditQuestion(
  user: { sub: string; roles: string[] },
  question: { courseId: string | null; course: { id: string; ownerId: string | null; status: string } | null }
): boolean {
  if (isAdmin(user)) return true;
  if (!question.course) return false;
  return canEditCourse(user, question.course);
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireEditorApi();
  if (!guard.ok) return guard.response;

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Eingabe ungültig." }, { status: 400 });
  }
  const data: { question?: string; answer?: string } = {};
  if (parsed.data.question !== undefined) data.question = parsed.data.question;
  if (parsed.data.answer !== undefined) data.answer = parsed.data.answer;
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Keine Daten zum Aktualisieren." }, { status: 400 });
  }

  const existing = await loadQuestionWithCourse(params.id);
  if (!existing) {
    return NextResponse.json({ error: "Frage nicht gefunden." }, { status: 404 });
  }
  if (!canEditQuestion(guard.user, existing)) {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
  }

  await prisma.question.update({ where: { id: params.id }, data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireEditorApi();
  if (!guard.ok) return guard.response;

  const existing = await loadQuestionWithCourse(params.id);
  if (!existing) {
    return NextResponse.json({ error: "Frage nicht gefunden." }, { status: 404 });
  }
  if (!canEditQuestion(guard.user, existing)) {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
  }

  await prisma.question.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
