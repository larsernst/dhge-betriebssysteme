export interface OriginCheck {
  ok: boolean;
  reason?: string;
}

export function getAllowedOrigins(): string[] {
  const raw = process.env.ALLOWED_ORIGINS ?? "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function checkSameOrigin(request: Request): OriginCheck {
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite === "same-origin" || secFetchSite === "none") {
    return { ok: true };
  }

  const origin = request.headers.get("origin") ?? request.headers.get("referer");
  if (!origin) {
    return { ok: false, reason: "fehlender Origin-Header" };
  }

  let originHost = "";
  try {
    originHost = new URL(origin).host;
  } catch {
    return { ok: false, reason: "ungültiger Origin" };
  }

  const host = request.headers.get("host");
  if (host && originHost === host) {
    return { ok: true };
  }

  const allowed = getAllowedOrigins();
  for (const a of allowed) {
    try {
      if (new URL(a).host === originHost) {
        return { ok: true };
      }
    } catch {
      /* ignore invalid allowed origin */
    }
  }

  return { ok: false, reason: "Origin nicht erlaubt" };
}

export function requireSameOrigin(request: Request): OriginCheck {
  return checkSameOrigin(request);
}
