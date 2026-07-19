import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEditorApi } from "@/lib/auth";
import { canEditCourse } from "@/lib/course-access";
import { reorderSchema } from "@/lib/validation";

type Params = { params: { id: string } };

// Setzt die Reihenfolge von Fragen innerhalb EINES Kapitels:
// ids = geordnete Liste der Fragen-IDs dieses Kapitels (chapterId kann auch
// null = „Nicht zugeordnet" sein, via Query-Param ?chapter=<id|null>).
export async function PATCH(request: Request, { params }: Params) {
  const guard = await requireEditorApi();
  if (!guard.ok) return guard.response;

  const course = await prisma.course.findUnique({
    where: { id: params.id },
    select: { id: true, ownerId: true, status: true },
  });
  if (!course || !canEditCourse(guard.user, course)) {
    return NextResponse.json({ error: "Kurs nicht gefunden." }, { status: 404 });
  }

  const chapterParam = new URL(request.url).searchParams.get("chapter");
  const chapterId = chapterParam === null || chapterParam === "null" ? null : chapterParam;

  const parsed = reorderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Eingabe ungültig.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const questionIds = parsed.data.ids;
  const existing = await prisma.question.findMany({
    where: { courseId: course.id, chapterId },
    select: { id: true },
  });
  const existingIds = new Set(existing.map((q) => q.id));
  if (
    questionIds.length !== existingIds.size ||
    !questionIds.every((id) => existingIds.has(id))
  ) {
    return NextResponse.json(
      { error: "Die ID-Liste muss genau die Fragen des Kapitels enthalten." },
      { status: 400 }
    );
  }

  await prisma.$transaction(
    questionIds.map((id, index) =>
      prisma.question.update({ where: { id }, data: { order: index + 1 } })
    )
  );
  return NextResponse.json({ ok: true });
}
