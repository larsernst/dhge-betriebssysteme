import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const existing = await prisma.question.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Frage nicht gefunden." }, { status: 404 });
  }

  await prisma.question.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
