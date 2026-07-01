import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { createSessionToken, setSessionCookie } from "@/lib/session";

const schema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Eingabe ungültig.", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: "Diese E-Mail ist bereits registriert." }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email: email.toLowerCase(), passwordHash },
  });

  const token = await createSessionToken({
    sub: user.id,
    email: user.email,
    name: user.name,
  });
  await setSessionCookie(token);

  return NextResponse.json({ ok: true, user: { id: user.id, email: user.email } });
}