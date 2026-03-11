import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req, { params }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid session id" }, { status: 400 });
  }

  const { rows } = await pool.query(
    `select sp.id,
            sp.title as speech_title,
            sp.elapsed_seconds,
            sp.created_at,
            p.id as speaker_id,
            p.name as speaker_name,
            p.email as speaker_email,
            p.title_position as speaker_title_position
     from public.speeches sp
     join public.sessions se on se.public_id = $1
     join public.participants p on p.id = sp.speaker_id
     where sp.session_id = se.id
     order by sp.created_at asc`,
    [id]
  );

  return NextResponse.json({ speeches: rows });
}

export async function POST(req, { params }) {
  const ip = getClientIp(req);
  if (!rateLimit(ip, { limit: 20, windowMs: 60_000 })) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid session id" }, { status: 400 });
  }

  const body = await req.json();
  const speaker_id = Number(body?.speaker_id);
  const title = (body?.title ?? "").trim() || null;
  const elapsed_seconds = Number.isFinite(Number(body?.elapsed_seconds))
    ? Number(body.elapsed_seconds)
    : null;

  if (!Number.isFinite(speaker_id)) {
    return NextResponse.json({ error: "speaker_id is required." }, { status: 400 });
  }

  const { rows } = await pool.query(
    `insert into public.speeches (session_id, speaker_id, title, elapsed_seconds)
     select se.id, $2, $3, $4
     from public.sessions se
     where se.public_id = $1
     returning id, session_id, speaker_id, title, elapsed_seconds, created_at`,
    [id, speaker_id, title, elapsed_seconds]
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  return NextResponse.json({ speech: rows[0] }, { status: 201 });
}
