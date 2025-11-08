import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req) {
  const { password } = await req.json();
  const expected = process.env.REPORTS_PASSWORD;
  if (!expected) return NextResponse.json({ error: "Server missing REPORTS_PASSWORD" }, { status: 500 });
  if (password !== expected) return NextResponse.json({ error: "Invalid passcode" }, { status: 401 });

  const cookieName = process.env.REPORTS_COOKIE_NAME || "tm_auth";
  const maxAge = Number(process.env.REPORTS_COOKIE_MAX_AGE || 60 * 60 * 24 * 7);

  const res = NextResponse.json({ ok: true }, { status: 200 });
  res.cookies.set(cookieName, expected, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge,
  });
  return res;
}
