import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";

describe("password hashing", () => {
  it("hashes a password and verifies it", async () => {
    const hash = await hashPassword("geheim1234");
    expect(hash).not.toBe("geheim1234");
    expect(await verifyPassword("geheim1234", hash)).toBe(true);
  });

  it("rejects a wrong password", async () => {
    const hash = await hashPassword("geheim1234");
    expect(await verifyPassword("falsch", hash)).toBe(false);
  });

  it("produces unique hashes for identical inputs (salt)", async () => {
    const a = await hashPassword("geheim1234");
    const b = await hashPassword("geheim1234");
    expect(a).not.toBe(b);
  });
});