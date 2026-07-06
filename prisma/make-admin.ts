// Ernennen oder auflisten von Admins.
//
//   npm run db:make-admin -- --email user@example.com
//     Befördert den Nutzer zur Admin-Rolle, sofern noch kein Admin existiert.
//
//   npm run db:make-admin -- --email user@example.com --force
//     Befördert den Nutzer auch dann, wenn bereits Admins existieren.
//
//   npm run db:make-admin -- --list
//     Listet alle aktuellen Admins auf (keine Mutation).

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const ADMIN_ROLE = "admin";

export interface ParsedArgs {
  list: boolean;
  email: string | null;
  force: boolean;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const list = argv.includes("--list");
  const force = argv.includes("--force");
  const emailIdx = argv.indexOf("--email");
  const email =
    emailIdx !== -1 && argv[emailIdx + 1] ? argv[emailIdx + 1].trim() : null;
  return { list, email, force };
}

export interface MakeAdminDeps {
  findUserByEmail: (email: string) => Promise<{ id: string; name: string; email: string } | null>;
  countAdmins: () => Promise<number>;
  upsertAdminRole: (userId: string) => Promise<void>;
  listAdmins: () => Promise<{ name: string; email: string }[]>;
}

export type MakeAdminOutcome =
  | { status: "ok"; user: { name: string; email: string } }
  | { status: "aborted-already-exists"; existingCount: number }
  | { status: "user-not-found"; email: string }
  | { status: "noop-already-admin"; user: { name: string; email: string } }
  | { status: "list"; admins: { name: string; email: string }[] }
  | { status: "missing-email" };

// Reine Geschäftslogik, unabhängig von Prisma – testbar mit gemockten Deps.
export async function runMakeAdmin(
  args: ParsedArgs,
  deps: MakeAdminDeps
): Promise<MakeAdminOutcome> {
  if (args.list) {
    const admins = await deps.listAdmins();
    return { status: "list", admins };
  }
  if (!args.email) {
    return { status: "missing-email" };
  }

  const user = await deps.findUserByEmail(args.email);
  if (!user) {
    return { status: "user-not-found", email: args.email };
  }

  if (!args.force) {
    const existing = await deps.countAdmins();
    if (existing > 0) {
      return { status: "aborted-already-exists", existingCount: existing };
    }
  }

  await deps.upsertAdminRole(user.id);
  return { status: "ok", user: { name: user.name, email: user.email } };
}

function depsFromPrisma(): MakeAdminDeps {
  return {
    findUserByEmail: (email) =>
      prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: { id: true, name: true, email: true },
      }),
    countAdmins: () =>
      prisma.userRole.count({ where: { role: ADMIN_ROLE } }),
    upsertAdminRole: (userId) =>
      prisma.userRole
        .upsert({
          where: { userId_role: { userId, role: ADMIN_ROLE } },
          create: { userId, role: ADMIN_ROLE },
          update: {},
        })
        .then(() => undefined),
    listAdmins: () =>
      prisma.userRole
        .findMany({
          where: { role: ADMIN_ROLE },
          select: { user: { select: { name: true, email: true } } },
        })
        .then((rows) => rows.map((r) => r.user)),
  };
}

function report(outcome: MakeAdminOutcome): void {
  switch (outcome.status) {
    case "list":
      if (outcome.admins.length === 0) {
        console.log("Keine Admins vorhanden.");
      } else {
        console.log(`${outcome.admins.length} Admin(s):`);
        for (const a of outcome.admins) {
          console.log(`  ${a.name} <${a.email}>`);
        }
      }
      break;
    case "missing-email":
      console.error(
        "Fehler: Bitte --email <adresse> angeben oder --list verwenden.\n" +
          "  npm run db:make-admin -- --email user@example.com\n" +
          "  npm run db:make-admin -- --list"
      );
      process.exitCode = 1;
      break;
    case "user-not-found":
      console.error(`Fehler: Kein Nutzer mit E-Mail „${outcome.email}".`);
      process.exitCode = 1;
      break;
    case "aborted-already-exists":
      console.error(
        `Abgebrochen: Es existiert bereits ${outcome.existingCount} Admin(s).\n` +
          "Um trotzdem einen weiteren Admin anzulegen, --force verwenden:\n" +
          `  npm run db:make-admin -- --email <adresse> --force`
      );
      process.exitCode = 1;
      break;
    case "noop-already-admin":
      console.log(
        `„${outcome.user.name}" <${outcome.user.email}> ist bereits Admin. Nichts zu tun.`
      );
      break;
    case "ok":
      console.log(
        `✓ „${outcome.user.name}" <${outcome.user.email}> wurde zur Admin-Rolle befördert.`
      );
      break;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const outcome = await runMakeAdmin(args, depsFromPrisma());
  report(outcome);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
