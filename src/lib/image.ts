// Kursbild-Validierung (Phase E4). Rein – ohne DB/Server-Imports, damit
// sie sowohl die API-Route als auch Tests nutzen können.

export const COURSE_IMAGE_MAX_BYTES = 2 * 1024 * 1024; // 2 MB

export const COURSE_IMAGE_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export type ImageValidation =
  | { ok: true; mime: string }
  | { ok: false; error: string };

export function validateCourseImage(mime: string, sizeBytes: number): ImageValidation {
  if (!(mime in COURSE_IMAGE_TYPES)) {
    return {
      ok: false,
      error: `Ungültiges Bildformat „${mime || "unbekannt"}“. Erlaubt: PNG, JPEG, WebP.`,
    };
  }
  if (sizeBytes <= 0) {
    return { ok: false, error: "Die Datei ist leer." };
  }
  if (sizeBytes > COURSE_IMAGE_MAX_BYTES) {
    const mb = (sizeBytes / (1024 * 1024)).toFixed(1);
    return { ok: false, error: `Bild zu groß (${mb} MB). Maximum: 2 MB.` };
  }
  return { ok: true, mime };
}

// Magische Bytes prüfen (nicht nur der deklarierte MIME-Type).
export function sniffImageMime(bytes: Uint8Array): string | null {
  if (bytes.length >= 8) {
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
      bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
    ) {
      return "image/png";
    }
  }
  if (bytes.length >= 3) {
    // JPEG: FF D8 FF
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return "image/jpeg";
    }
  }
  if (bytes.length >= 12) {
    // WebP: "RIFF" .... "WEBP"
    if (
      bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
    ) {
      return "image/webp";
    }
  }
  return null;
}
