import { NextResponse } from "next/server";
export async function POST() {
  const name = process.env.REPORTS_COOKIE_NAME || "tm_auth";
  const res = NextResponse.json({ ok: true });
  res.cookies.set(name, "", { path: "/", maxAge: 0 });
  return res;
}
