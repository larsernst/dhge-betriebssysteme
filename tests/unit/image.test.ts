import { describe, expect, test } from "vitest";
import {
  COURSE_IMAGE_MAX_BYTES,
  sniffImageMime,
  validateCourseImage,
} from "@/lib/image";

describe("validateCourseImage", () => {
  test("erlaubte Formate innerhalb des Limits", () => {
    expect(validateCourseImage("image/png", 1000).ok).toBe(true);
    expect(validateCourseImage("image/jpeg", COURSE_IMAGE_MAX_BYTES).ok).toBe(true);
    expect(validateCourseImage("image/webp", 500_000).ok).toBe(true);
  });

  test("verweigert ungültige Formate", () => {
    const gif = validateCourseImage("image/gif", 1000);
    expect(gif.ok).toBe(false);
    if (!gif.ok) expect(gif.error).toContain("PNG, JPEG, WebP");
    expect(validateCourseImage("image/svg+xml", 1000).ok).toBe(false);
    expect(validateCourseImage("", 1000).ok).toBe(false);
  });

  test("verweigert leere und zu große Dateien", () => {
    const empty = validateCourseImage("image/png", 0);
    expect(empty.ok).toBe(false);
    if (!empty.ok) expect(empty.error).toContain("leer");
    const big = validateCourseImage("image/png", COURSE_IMAGE_MAX_BYTES + 1);
    expect(big.ok).toBe(false);
    if (!big.ok) expect(big.error).toContain("2 MB");
  });
});

describe("sniffImageMime (Magic Bytes)", () => {
  test("PNG-Signatur", () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
    expect(sniffImageMime(png)).toBe("image/png");
  });

  test("JPEG-Signatur", () => {
    expect(sniffImageMime(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0]))).toBe("image/jpeg");
  });

  test("WebP-Signatur (RIFF....WEBP)", () => {
    const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
    expect(sniffImageMime(webp)).toBe("image/webp");
  });

  test("erkennt Nicht-Bilder und zu kurze Daten", () => {
    expect(sniffImageMime(new Uint8Array([0x4d, 0x5a]))).toBeNull(); // EXE
    expect(sniffImageMime(new Uint8Array([0x89]))).toBeNull();
    expect(sniffImageMime(new Uint8Array([]))).toBeNull();
  });
});
