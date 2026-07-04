import { describe, expect, it, vi } from "vitest";
import { parseArgs, runMakeAdmin, type MakeAdminDeps } from "../../prisma/make-admin";

function makeDeps(overrides: Partial<MakeAdminDeps> = {}): MakeAdminDeps {
  return {
    findUserByEmail: vi.fn(async () => ({
      id: "u1",
      name: "Maxi Muster",
      email: "maxi@example.org",
    })),
    countAdmins: vi.fn(async () => 0),
    upsertAdminRole: vi.fn(async () => undefined),
    listAdmins: vi.fn(async () => []),
    ...overrides,
  };
}

describe("parseArgs", () => {
  it("parses --email", () => {
    expect(parseArgs(["--email", "a@b.de"])).toEqual({
      list: false,
      email: "a@b.de",
      force: false,
    });
  });

  it("parses --list", () => {
    expect(parseArgs(["--list"])).toEqual({ list: true, email: null, force: false });
  });

  it("parses --force together with --email", () => {
    expect(parseArgs(["--email", "a@b.de", "--force"])).toEqual({
      list: false,
      email: "a@b.de",
      force: true,
    });
  });

  it("returns null email when --email is missing its value", () => {
    expect(parseArgs(["--email"]).email).toBeNull();
  });
});

describe("runMakeAdmin", () => {
  it("promotes a user when no admin exists", async () => {
    const deps = makeDeps();
    const outcome = await runMakeAdmin(parseArgs(["--email", "maxi@example.org"]), deps);
    expect(outcome).toEqual({
      status: "ok",
      user: { name: "Maxi Muster", email: "maxi@example.org" },
    });
    expect(deps.upsertAdminRole).toHaveBeenCalledWith("u1");
  });

  it("aborts when an admin already exists and --force is not set", async () => {
    const deps = makeDeps({ countAdmins: vi.fn(async () => 1) });
    const outcome = await runMakeAdmin(parseArgs(["--email", "maxi@example.org"]), deps);
    expect(outcome).toEqual({ status: "aborted-already-exists", existingCount: 1 });
    expect(deps.upsertAdminRole).not.toHaveBeenCalled();
  });

  it("promotes anyway when --force is set even if admins exist", async () => {
    const deps = makeDeps({ countAdmins: vi.fn(async () => 3) });
    const outcome = await runMakeAdmin(
      parseArgs(["--email", "maxi@example.org", "--force"]),
      deps
    );
    expect(outcome.status).toBe("ok");
    expect(deps.upsertAdminRole).toHaveBeenCalledWith("u1");
  });

  it("errors when the email is unknown", async () => {
    const deps = makeDeps({ findUserByEmail: vi.fn(async () => null) });
    const outcome = await runMakeAdmin(parseArgs(["--email", "ghost@example.org"]), deps);
    expect(outcome).toEqual({ status: "user-not-found", email: "ghost@example.org" });
    expect(deps.upsertAdminRole).not.toHaveBeenCalled();
  });

  it("errors when no email and no --list is given", async () => {
    const deps = makeDeps();
    const outcome = await runMakeAdmin(parseArgs([]), deps);
    expect(outcome.status).toBe("missing-email");
    expect(deps.upsertAdminRole).not.toHaveBeenCalled();
  });

  it("lists admins without mutating anything", async () => {
    const deps = makeDeps({
      listAdmins: vi.fn(async () => [
        { name: "Ada", email: "ada@example.org" },
        { name: "Bob", email: "bob@example.org" },
      ]),
    });
    const outcome = await runMakeAdmin(parseArgs(["--list"]), deps);
    expect(outcome).toEqual({
      status: "list",
      admins: [
        { name: "Ada", email: "ada@example.org" },
        { name: "Bob", email: "bob@example.org" },
      ],
    });
    expect(deps.upsertAdminRole).not.toHaveBeenCalled();
    expect(deps.findUserByEmail).not.toHaveBeenCalled();
    expect(deps.countAdmins).not.toHaveBeenCalled();
  });

  it("lowercases nothing in args but the lookup is left to the dep", async () => {
    const findFn = vi.fn(async () => null);
    const deps = makeDeps({ findUserByEmail: findFn });
    await runMakeAdmin(parseArgs(["--email", "Mixed@Case.org"]), deps);
    expect(findFn).toHaveBeenCalledWith("Mixed@Case.org");
  });
});
