import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEditorApi } from "@/lib/auth";
import { canEditCourse } from "@/lib/course-access";
import { duplicateCourse } from "@/lib/course-transfer";

type Params = { params: { id: string } };

// Kurs duplizieren: Kopie (Entwurf, aktueller User als Besitzer) mit
// Kapiteln und Fragen; Nutzerfortschritt bleibt am Original.
export async function POST(_request: Request, { params }: Params) {
  const guard = await requireEditorApi();
  if (!guard.ok) return guard.response;

  const course = await prisma.course.findUnique({
    where: { id: params.id },
    select: { id: true, ownerId: true, status: true },
  });
  if (!course || !canEditCourse(guard.user, course)) {
    return NextResponse.json({ error: "Kurs nicht gefunden." }, { status: 404 });
  }

  const copy = await duplicateCourse(prisma, course.id, guard.user.sub);
  if (!copy) {
    return NextResponse.json({ error: "Duplizieren fehlgeschlagen." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, courseId: copy.id }, { status: 201 });
}
