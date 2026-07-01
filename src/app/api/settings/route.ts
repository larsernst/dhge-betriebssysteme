import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

const schema = z.object({
  mcqEnabled: z.boolean(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }
  const me = await prisma.user.findUnique({
    where: { id: user.sub },
    select: { mcqEnabled: true },
  });
  return NextResponse.json({ mcqEnabled: me?.mcqEnabled ?? true });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Eingabe ungültig." }, { status: 400 });
  }
  const me = await prisma.user.update({
    where: { id: user.sub },
    data: { mcqEnabled: parsed.data.mcqEnabled },
    select: { mcqEnabled: true },
  });
  return NextResponse.json({ mcqEnabled: me.mcqEnabled });
}