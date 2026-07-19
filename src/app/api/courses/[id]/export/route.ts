import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEditorApi } from "@/lib/auth";
import { canEditCourse } from "@/lib/course-access";
import type { CourseExport } from "@/lib/course-transfer";

type Params = { params: { id: string } };

// Kurs-Export als JSON-Datei (Kurs + Kapitel + Fragen inkl. taskType/payload).
export async function GET(_request: Request, { params }: Params) {
  const guard = await requireEditorApi();
  if (!guard.ok) return guard.response;

  const course = await prisma.course.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      ownerId: true,
      status: true,
      chapters: { orderBy: { order: "asc" } },
      questions: { orderBy: [{ chapter: "asc" }, { order: "asc" }, { id: "asc" }] },
    },
  });
  if (!course || !canEditCourse(guard.user, course)) {
    return NextResponse.json({ error: "Kurs nicht gefunden." }, { status: 404 });
  }

  const slugByChapterId = new Map(course.chapters.map((c) => [c.id, c.slug]));
  const body: CourseExport = {
    format: "lernapp-course@1",
    exportedAt: new Date().toISOString(),
    course: {
      title: course.title,
      slug: course.slug,
      description: course.description,
    },
    chapters: course.chapters.map((c) => ({
      slug: c.slug,
      title: c.title,
      description: c.description,
      order: c.order,
    })),
    questions: course.questions.map((q) => ({
      id: q.id,
      chapter: q.chapter,
      chapterTitle: q.chapterTitle,
      chapterSlug: q.chapterId ? (slugByChapterId.get(q.chapterId) ?? null) : null,
      question: q.question,
      answer: q.answer,
      sourceRef: q.sourceRef,
      confidence: q.confidence,
      taskType: q.taskType,
      payload: q.payload,
      order: q.order,
    })),
  };

  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="kurs-${course.slug}.json"`,
    },
  });
}
