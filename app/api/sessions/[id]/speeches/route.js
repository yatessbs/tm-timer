import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_req, { params }) {
  const sessionId = Number(params.id);
  if (!Number.isFinite(sessionId)) {
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
     join public.participants p on p.id = sp.speaker_id
     where sp.session_id = $1
     order by sp.created_at asc`,
    [sessionId]
  );

  return NextResponse.json({ speeches: rows });
}

export async function POST(req, { params }) {
  const sessionId = Number(params.id);
  if (!Number.isFinite(sessionId)) {
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
     values ($1, $2, $3, $4)
     returning id, session_id, speaker_id, title, elapsed_seconds, created_at`,
    [sessionId, speaker_id, title, elapsed_seconds]
  );

  return NextResponse.json({ speech: rows[0] }, { status: 201 });
}