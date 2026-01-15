import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const { rows } = await pool.query(
    `select id, name, email, title_position
     from public.participants
     order by name asc`
  );
  return NextResponse.json({ participants: rows });
}

export async function POST(req) {
  const body = await req.json();
  const name = (body?.name ?? "").trim();
  const email = (body?.email ?? "").trim() || null;
  const title_position = (body?.title_position ?? "").trim() || null;

  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const { rows } = await pool.query(
    `insert into public.participants (name, email, title_position)
     values ($1, $2, $3)
     returning id, name, email, title_position`,
    [name, email, title_position]
  );

  return NextResponse.json({ participant: rows[0] }, { status: 201 });
}