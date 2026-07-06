import { describe, expect, it } from "vitest";
import { isAdmin } from "@/lib/auth";

describe("isAdmin", () => {
  it("returns true when the user has the admin role", () => {
    expect(isAdmin({ roles: ["admin"] })).toBe(true);
    expect(isAdmin({ roles: ["other", "admin"] })).toBe(true);
  });

  it("returns false when the user lacks the admin role", () => {
    expect(isAdmin({ roles: [] })).toBe(false);
    expect(isAdmin({ roles: ["editor"] })).toBe(false);
  });

  it("returns false for null/undefined", () => {
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
  });
});
