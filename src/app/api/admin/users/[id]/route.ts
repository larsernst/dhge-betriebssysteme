import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAuthorizedAdmin } from "@/lib/admin-auth";

const patchSchema = z
  .object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    mcqEnabled: z.boolean().optional(),
  })
  .refine((v) => v.name !== undefined || v.email !== undefined || v.mcqEnabled !== undefined, {
    message: "Keine Daten zum Aktualisieren.",
  });

type Params = { params: { id: string } };

export async function PATCH(request: Request, { params }: Params) {
  if (!isAuthorizedAdmin(request)) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Eingabe ungültig.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Nutzer nicht gefunden." }, { status: 404 });
  }

  const data: Prisma.UserUpdateInput = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.mcqEnabled !== undefined) data.mcqEnabled = parsed.data.mcqEnabled;
  if (parsed.data.email !== undefined) {
    const email = parsed.data.email.toLowerCase();
    const conflict = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (conflict && conflict.id !== params.id) {
      return NextResponse.json(
        { error: "Diese E-Mail-Adresse wird bereits verwendet." },
        { status: 409 }
      );
    }
    data.email = email;
  }

  const updated = await prisma.user.update({
    where: { id: params.id },
    data,
    select: { id: true, name: true, email: true, mcqEnabled: true, createdAt: true },
  });
  return NextResponse.json({ user: updated });
}

export async function DELETE(request: Request, { params }: Params) {
  if (!isAuthorizedAdmin(request)) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }

  const existing = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Nutzer nicht gefunden." }, { status: 404 });
  }

  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
