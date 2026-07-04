import { getCurrentUser, type SessionPayload } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";

export const ADMIN_ROLE = "admin";

export function isAdmin(user: { roles: string[] } | null | undefined): boolean {
  return !!user && user.roles.includes(ADMIN_ROLE);
}

// Liefert den aktuellen Nutzer mit frisch aus der DB geladenen Rollen.
// Rollen werden pro Request aus der DB gelesen (nicht nur dem JWT vertraut),
// damit ein entzogener Admin sofort gesperrt ist.
export async function getCurrentUserWithRoles(): Promise<SessionPayload | null> {
  const base = await getCurrentUser();
  if (!base) return null;

  const roleRows = await prisma.userRole.findMany({
    where: { userId: base.sub },
    select: { role: true },
  });
  return { ...base, roles: roleRows.map((r) => r.role) };
}

type GuardResult =
  | { ok: true; user: SessionPayload }
  | { ok: false; response: NextResponse };

// Schuetzt API-Routen: 401 wenn nicht eingeloggt, 403 wenn kein Admin.
export async function requireAdminApi(): Promise<GuardResult> {
  const user = await getCurrentUserWithRoles();
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 }) };
  }
  if (!isAdmin(user)) {
    return { ok: false, response: NextResponse.json({ error: "Keine Admin-Berechtigung." }, { status: 403 }) };
  }
  return { ok: true, user };
}

// Schuetzt Server-Component-Seiten: leitet Nicht-Angemeldete zu /login,
// angemeldete Nicht-Admins zu / weiter. Gibt bei Admins den User zurueck.
export async function requireAdminPage(): Promise<SessionPayload> {
  const user = await getCurrentUserWithRoles();
  if (!user) redirect("/login");
  if (!isAdmin(user)) redirect("/");
  return user;
}

