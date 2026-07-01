import { describe, expect, it } from "vitest";
import { verifySessionToken, createSessionToken } from "@/lib/session";

const SECRET = "test-secret-do-not-use-in-production";

describe("session token (jose)", () => {
  it("round-trips a token and returns the payload", async () => {
    process.env.JWT_SECRET = SECRET;
    process.env.NEXTAUTH_SECRET = SECRET;
    const token = await createSessionToken({
      sub: "user_1",
      email: "max@example.org",
      name: "Max",
    });
    const payload = await verifySessionToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.sub).toBe("user_1");
    expect(payload?.email).toBe("max@example.org");
    expect(payload?.name).toBe("Max");
  });

  it("returns null for a tampered token", async () => {
    process.env.JWT_SECRET = SECRET;
    process.env.NEXTAUTH_SECRET = SECRET;
    const bad = (await createSessionToken({ sub: "x", email: "y", name: "z" })) + "tamper";
    expect(await verifySessionToken(bad)).toBeNull();
  });
});