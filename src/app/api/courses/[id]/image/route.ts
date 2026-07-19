import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserWithRoles, requireEditorApi } from "@/lib/auth";
import { canEditCourse, canViewCourse } from "@/lib/course-access";
import { sniffImageMime, validateCourseImage } from "@/lib/image";

type Params = { params: { id: string } };

// Kursbild ausliefern: öffentlich für veröffentlichte Kurse; Entwürfe nur
// für Besitzer/Admins. Cache-freundlich (Inhalt ändert sich nur bei Upload).
export async function GET(_request: Request, { params }: Params) {
  const course = await prisma.course.findUnique({
    where: { id: params.id },
    select: { id: true, status: true, ownerId: true, imageMime: true, imageData: true },
  });
  if (!course || !course.imageData || !course.imageMime) {
    return new NextResponse(null, { status: 404 });
  }

  if (course.status !== "published") {
    const user = await getCurrentUserWithRoles();
    if (!canViewCourse(user, course)) {
      return new NextResponse(null, { status: 404 });
    }
  }

  return new NextResponse(new Uint8Array(course.imageData), {
    headers: {
      "Content-Type": course.imageMime,
      "Cache-Control": "public, max-age=3600, must-revalidate",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

// Upload: multipart/form-data mit Datei-Feld "file". Server-seitige
// Format-/Größen-Prüfung inkl. Magic-Bytes (nicht nur deklarierter MIME).
export async function POST(request: Request, { params }: Params) {
  const guard = await requireEditorApi();
  if (!guard.ok) return guard.response;

  const course = await prisma.course.findUnique({
    where: { id: params.id },
    select: { id: true, ownerId: true, status: true },
  });
  if (!course || !canEditCourse(guard.user, course)) {
    return NextResponse.json({ error: "Kurs nicht gefunden." }, { status: 404 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Keine Datei übergeben (Feld „file“)." }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const declared = file.type || "application/octet-stream";
  const check = validateCourseImage(declared, bytes.length);
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: 400 });
  }
  const sniffed = sniffImageMime(bytes);
  if (sniffed !== declared) {
    return NextResponse.json(
      { error: "Dateiinhalt passt nicht zum Format (Magic-Bytes-Prüfung)." },
      { status: 400 }
    );
  }

  await prisma.course.update({
    where: { id: course.id },
    data: { imageMime: declared, imageData: Buffer.from(bytes) },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: Params) {
  const guard = await requireEditorApi();
  if (!guard.ok) return guard.response;

  const course = await prisma.course.findUnique({
    where: { id: params.id },
    select: { id: true, ownerId: true, status: true },
  });
  if (!course || !canEditCourse(guard.user, course)) {
    return NextResponse.json({ error: "Kurs nicht gefunden." }, { status: 404 });
  }

  await prisma.course.update({
    where: { id: course.id },
    data: { imageMime: null, imageData: null },
  });
  return NextResponse.json({ ok: true });
}
