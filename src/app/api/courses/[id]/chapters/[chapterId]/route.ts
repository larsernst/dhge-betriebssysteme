import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEditorApi } from "@/lib/auth";
import { canEditCourse } from "@/lib/course-access";
import { chapterPatchSchema } from "@/lib/validation";

type Params = { params: { id: string; chapterId: string } };

async function loadChapterWithCourse(courseId: string, chapterId: string) {
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    select: {
      id: true,
      courseId: true,
      title: true,
      order: true,
      course: { select: { id: true, ownerId: true, status: true } },
    },
  });
  if (!chapter || chapter.courseId !== courseId) return null;
  return chapter;
}

export async function PATCH(request: Request, { params }: Params) {
  const guard = await requireEditorApi();
  if (!guard.ok) return guard.response;

  const chapter = await loadChapterWithCourse(params.id, params.chapterId);
  if (!chapter || !canEditCourse(guard.user, chapter.course)) {
    return NextResponse.json({ error: "Kapitel nicht gefunden." }, { status: 404 });
  }

  const parsed = chapterPatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Eingabe ungültig.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const data: { title?: string; description?: string | null } = {};
  if (parsed.data.title !== undefined) data.title = parsed.data.title;
  if (parsed.data.description !== undefined) data.description = parsed.data.description;

  const updated = await prisma.chapter.update({
    where: { id: chapter.id },
    data,
    select: { id: true, slug: true, title: true, description: true, order: true },
  });

  // Flache Anzeige-Felder der verknüpften Fragen synchron halten.
  if (data.title !== undefined) {
    await prisma.question.updateMany({
      where: { chapterId: chapter.id },
      data: { chapterTitle: data.title },
    });
  }

  return NextResponse.json({ chapter: updated });
}

export async function DELETE(_request: Request, { params }: Params) {
  const guard = await requireEditorApi();
  if (!guard.ok) return guard.response;

  const chapter = await loadChapterWithCourse(params.id, params.chapterId);
  if (!chapter || !canEditCourse(guard.user, chapter.course)) {
    return NextResponse.json({ error: "Kapitel nicht gefunden." }, { status: 404 });
  }

  // Beschlossenes Verhalten: Fragen werden NICHT mitgelöscht, sondern
  // entkoppelt (landen im Curriculum unter „Nicht zugeordnet").
  await prisma.question.updateMany({
    where: { chapterId: chapter.id },
    data: { chapterId: null },
  });
  await prisma.chapter.delete({ where: { id: chapter.id } });
  return NextResponse.json({ ok: true });
}
