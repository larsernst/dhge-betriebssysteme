import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireEditorApi } from "@/lib/auth";
import { canEditCourse } from "@/lib/course-access";
import { applyCourseImport, parseCourseImport } from "@/lib/course-transfer";

type Params = { params: { id: string } };

const importBodySchema = z.object({
  data: z.unknown(),
  dryRun: z.boolean().optional(),
});

// Kurs-scoped JSON-Import für Editoren (Phase E4). Ersetzt für Editor-
// Zwecke den Admin-Upload: validiert alle Einträge (inkl. Payload-Schemata)
// und berichtet pro Zeile – mit dryRun=true ohne zu schreiben.
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

  const parsed = importBodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Body ungültig – erwartet { data: <Import-JSON>, dryRun?: boolean }." },
      { status: 400 }
    );
  }

  const result = parseCourseImport(parsed.data.data);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, dryRun: true, errors: result.errors },
      { status: 200 }
    );
  }

  if (parsed.data.dryRun) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      total: result.items.length,
      message: `${result.items.length} Frage(n) wären importierbar.`,
    });
  }

  const applied = await applyCourseImport(prisma, course.id, result.items);
  return NextResponse.json({
    ok: true,
    dryRun: false,
    total: result.items.length,
    ...applied,
  });
}
