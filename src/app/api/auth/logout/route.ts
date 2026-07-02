import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookieOptions } from "@/lib/session";
import { requireSameOrigin } from "@/lib/origin";

function publicBaseUrl(request: NextRequest): string {
  const proto = request.headers.get("x-forwarded-proto");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (proto && host) return `${proto}://${host}`;
  if (host) return `${request.nextUrl.protocol}//${host}`;
  return request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  const originCheck = requireSameOrigin(request);
  if (!originCheck.ok) {
    return NextResponse.json(
      { error: "Verboten: " + (originCheck.reason ?? "Ursprung nicht erlaubt") },
      { status: 403 }
    );
  }
  const { name, value, ...options } = getSessionCookieOptions("", 0);
  const res = NextResponse.redirect(new URL("/", publicBaseUrl(request)));
  res.cookies.set(name, value, options);
  return res;
}