import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEditorApi } from "@/lib/auth";
import { canEditCourse } from "@/lib/course-access";
import { reorderSchema } from "@/lib/validation";

type Params = { params: { id: string } };

// Setzt die Kapitel-Reihenfolge eines Kurses: ids = vollständige, geordnete
// Liste aller Kapitel-IDs des Kurses. Transaktional, damit keine
// Zwischenstände sichtbar werden.
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

  const parsed = reorderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Eingabe ungültig.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const chapterIds = parsed.data.ids;
  const existing = await prisma.chapter.findMany({
    where: { courseId: course.id },
    select: { id: true },
  });
  const existingIds = new Set(existing.map((c) => c.id));
  if (
    chapterIds.length !== existingIds.size ||
    !chapterIds.every((id) => existingIds.has(id))
  ) {
    return NextResponse.json(
      { error: "Die ID-Liste muss genau die Kapitel des Kurses enthalten." },
      { status: 400 }
    );
  }

  await prisma.$transaction(
    chapterIds.map((id, index) =>
      prisma.chapter.update({ where: { id }, data: { order: index + 1 } })
    )
  );
  return NextResponse.json({ ok: true });
}
