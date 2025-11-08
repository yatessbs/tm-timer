import { NextResponse } from "next/server";

const PROTECTED = ["/reports", "/api/reports"]; // gate UI & report APIs

export function middleware(req) {
  const url = req.nextUrl.pathname;

  const needsAuth = PROTECTED.some(prefix => url === prefix || url.startsWith(prefix + "/"));
  if (!needsAuth) return NextResponse.next();

  const cookieName = process.env.REPORTS_COOKIE_NAME || "tm_auth";
  const cookie = req.cookies.get(cookieName)?.value;
  const pass = process.env.REPORTS_PASSWORD;

  if (cookie && pass && cookie === pass) {
    return NextResponse.next();
  }

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
