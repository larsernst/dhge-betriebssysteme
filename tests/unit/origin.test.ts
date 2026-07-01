import { afterEach, describe, expect, it } from "vitest";
import { checkSameOrigin } from "@/lib/origin";

afterEach(() => {
  delete process.env.ALLOWED_ORIGINS;
});

function req(headers: Record<string, string>): Request {
  return new Request("https://bs.example.org/api/auth/logout", {
    method: "POST",
    headers,
  });
}

describe("checkSameOrigin", () => {
  it("allows same-origin via Sec-Fetch-Site", () => {
    expect(checkSameOrigin(req({ "sec-fetch-site": "same-origin" })).ok).toBe(true);
  });

  it("allows user-initiated navigation (sec-fetch-site=none)", () => {
    expect(checkSameOrigin(req({ "sec-fetch-site": "none" })).ok).toBe(true);
  });

  it("allows when Origin host matches Host header", () => {
    const r = req({
      origin: "https://bs.example.org",
      host: "bs.example.org",
    });
    expect(checkSameOrigin(r).ok).toBe(true);
  });

  it("blocks cross-origin without matching Host", () => {
    const r = req({
      origin: "https://evil.example",
      host: "bs.example.org",
    });
    expect(checkSameOrigin(r).ok).toBe(false);
  });

  it("blocks when Origin is missing and sec-fetch-site is cross-origin", () => {
    const r = req({ "sec-fetch-site": "cross-origin" });
    const res = checkSameOrigin(r);
    expect(res.ok).toBe(false);
  });

  it("allows an explicitly configured ALLOWED_ORIGINS entry", () => {
    process.env.ALLOWED_ORIGINS = "https://partner.example.org";
    const r = req({
      origin: "https://partner.example.org",
      host: "bs.example.org",
    });
    expect(checkSameOrigin(r).ok).toBe(true);
  });

  it("blocks other origins even with ALLOWED_ORIGINS set", () => {
    process.env.ALLOWED_ORIGINS = "https://partner.example.org";
    const r = req({
      origin: "https://evil.example",
      host: "bs.example.org",
    });
    expect(checkSameOrigin(r).ok).toBe(false);
  });
});