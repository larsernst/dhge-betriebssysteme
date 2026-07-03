export const ADMIN_TOKEN_MIN_LENGTH = 16;

function expectedToken(): string | null {
  const raw = process.env.ADMIN_TOKEN;
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed.length < ADMIN_TOKEN_MIN_LENGTH) return null;
  return trimmed;
}

export function isAuthorizedAdmin(request: Request): boolean {
  const expected = expectedToken();
  if (!expected) return false;
  const provided = getAdminTokenFromRequest(request);
  if (!provided) return false;
  return provided === expected;
}

export function getAdminTokenFromRequest(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) {
    const token = auth.slice(7).trim();
    if (token) return token;
  }
  const url = new URL(request.url);
  const queryToken = url.searchParams.get("token");
  if (queryToken) return queryToken;
  return null;
}
