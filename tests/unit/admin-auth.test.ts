import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getAdminTokenFromRequest, isAuthorizedAdmin } from "@/lib/admin-auth";

const TOKEN = "supersecret-admin-token-1234";

function req(opts: { headers?: Record<string, string>; url?: string } = {}): Request {
  return new Request(opts.url ?? "https://bs.example.org/api/admin/users", {
    headers: opts.headers ?? {},
  });
}

beforeEach(() => {
  process.env.ADMIN_TOKEN = TOKEN;
});

afterEach(() => {
  delete process.env.ADMIN_TOKEN;
});

describe("isAuthorizedAdmin", () => {
  it("blocks when ADMIN_TOKEN is unset", () => {
    delete process.env.ADMIN_TOKEN;
    expect(isAuthorizedAdmin(req({ headers: { authorization: `Bearer ${TOKEN}` } }))).toBe(false);
  });

  it("blocks when ADMIN_TOKEN is empty string", () => {
    process.env.ADMIN_TOKEN = "";
    expect(isAuthorizedAdmin(req({ headers: { authorization: `Bearer ${TOKEN}` } }))).toBe(false);
  });

  it("blocks when ADMIN_TOKEN is too short (< 16 chars)", () => {
    process.env.ADMIN_TOKEN = "short";
    expect(isAuthorizedAdmin(req({ headers: { authorization: "Bearer short" } }))).toBe(false);
  });

  it("blocks when ADMIN_TOKEN is whitespace-only", () => {
    process.env.ADMIN_TOKEN = "                    ";
    expect(isAuthorizedAdmin(req({ headers: { authorization: `Bearer ${TOKEN}` } }))).toBe(false);
  });

  it("accepts a matching Bearer token (case-insensitive scheme)", () => {
    expect(isAuthorizedAdmin(req({ headers: { authorization: `Bearer ${TOKEN}` } }))).toBe(true);
    expect(isAuthorizedAdmin(req({ headers: { authorization: `bearer ${TOKEN}` } }))).toBe(true);
  });

  it("rejects a wrong Bearer token", () => {
    expect(isAuthorizedAdmin(req({ headers: { authorization: "Bearer wrong-token" } }))).toBe(false);
  });

  it("accepts a matching ?token= query parameter", () => {
    expect(isAuthorizedAdmin(req({ url: `https://bs.example.org/api/admin/users?token=${TOKEN}` }))).toBe(true);
  });

  it("rejects when no token is present", () => {
    expect(isAuthorizedAdmin(req())).toBe(false);
  });

  it("tolerates trailing whitespace/newline in ADMIN_TOKEN env value", () => {
    process.env.ADMIN_TOKEN = `${TOKEN}\n`;
    expect(isAuthorizedAdmin(req({ headers: { authorization: `Bearer ${TOKEN}` } }))).toBe(true);
  });

  it("tolerates leading whitespace in ADMIN_TOKEN env value", () => {
    process.env.ADMIN_TOKEN = `  ${TOKEN}`;
    expect(isAuthorizedAdmin(req({ headers: { authorization: `Bearer ${TOKEN}` } }))).toBe(true);
  });

  it("does not tolerate quotes embedded in ADMIN_TOKEN env value", () => {
    process.env.ADMIN_TOKEN = `"${TOKEN}"`;
    expect(isAuthorizedAdmin(req({ headers: { authorization: `Bearer ${TOKEN}` } }))).toBe(false);
  });

  it("tolerates trailing spaces in the provided Bearer token", () => {
    expect(
      isAuthorizedAdmin(req({ headers: { authorization: `Bearer ${TOKEN}   ` } }))
    ).toBe(true);
  });
});

describe("getAdminTokenFromRequest", () => {
  it("reads the token from the Bearer header", () => {
    expect(getAdminTokenFromRequest(req({ headers: { authorization: `Bearer ${TOKEN}` } }))).toBe(TOKEN);
  });

  it("trims whitespace around the Bearer token", () => {
    expect(getAdminTokenFromRequest(req({ headers: { authorization: `Bearer   ${TOKEN}   ` } }))).toBe(TOKEN);
  });

  it("reads the token from the query string", () => {
    expect(getAdminTokenFromRequest(req({ url: `https://bs.example.org/api/admin/users?token=${TOKEN}` }))).toBe(TOKEN);
  });

  it("returns null when no token is present", () => {
    expect(getAdminTokenFromRequest(req())).toBe(null);
  });
});
