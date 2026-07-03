export const ADMIN_TOKEN_MIN_LENGTH = 16;

export function isAuthorizedAdmin(request: Request): boolean {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected || expected.length < ADMIN_TOKEN_MIN_LENGTH) return false;
  return getAdminTokenFromRequest(request) === expected;
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
