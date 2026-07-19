import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEditorApi } from "@/lib/auth";
import { canEditCourse } from "@/lib/course-access";
import { chapterCreateSchema } from "@/lib/validation";
import { slugify } from "@/lib/slug";

type Params = { params: { id: string } };

async function loadCourseForChapters(id: string) {
  return prisma.course.findUnique({
    where: { id },
    select: { id: true, ownerId: true, status: true },
  });
}

export async function GET(_request: Request, { params }: Params) {
  const guard = await requireEditorApi();
  if (!guard.ok) return guard.response;

  const course = await loadCourseForChapters(params.id);
  if (!course || !canEditCourse(guard.user, course)) {
    return NextResponse.json({ error: "Kurs nicht gefunden." }, { status: 404 });
  }

  const chapters = await prisma.chapter.findMany({
    where: { courseId: course.id },
    orderBy: { order: "asc" },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      order: true,
      _count: { select: { questions: true } },
    },
  });
  return NextResponse.json({ chapters });
}

export async function POST(request: Request, { params }: Params) {
  const guard = await requireEditorApi();
  if (!guard.ok) return guard.response;

  const course = await loadCourseForChapters(params.id);
  if (!course || !canEditCourse(guard.user, course)) {
    return NextResponse.json({ error: "Kurs nicht gefunden." }, { status: 404 });
  }

  const parsed = chapterCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Eingabe ungültig.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const base = slugify(parsed.data.title) || "kapitel";
  let slug = base;
  let suffix = 1;
  while (
    await prisma.chapter.findUnique({
      where: { courseId_slug: { courseId: course.id, slug } },
      select: { id: true },
    })
  ) {
    suffix++;
    slug = `${base}-${suffix}`;
  }

  const maxOrder = await prisma.chapter.aggregate({
    where: { courseId: course.id },
    _max: { order: true },
  });

  const chapter = await prisma.chapter.create({
    data: {
      courseId: course.id,
      slug,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      order: (maxOrder._max.order ?? 0) + 1,
    },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      order: true,
    },
  });
  return NextResponse.json({ chapter }, { status: 201 });
}
