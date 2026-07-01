import { describe, expect, it } from "vitest";
import { validateJwtSecret } from "@/lib/env";

function expectValid(secret: string) {
  expect(() => validateJwtSecret(secret)).not.toThrow();
}

function expectInvalid(secret: string | undefined, match: RegExp) {
  expect(() => validateJwtSecret(secret)).toThrow(match);
}

describe("validateJwtSecret", () => {
  it("accepts a long random secret", () => {
    expectValid("a-very-long-random-secret-1234567890");
  });

  it("rejects a missing secret", () => {
    expectInvalid(undefined, /nicht gesetzt|kürzer/i);
  });

  it("rejects a too-short secret", () => {
    expectInvalid("short", /kürzer/i);
  });

  it("rejects the placeholder from .env.example", () => {
    expectInvalid("bitte-durch-ein-langes-zufaelliges-geheimnis-ersetzen", /Platzhalter/i);
    expectInvalid("please-change-me-to-a-long-random-secret", /Platzhalter/i);
  });
});