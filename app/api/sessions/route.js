import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, session_date, location } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Session name is required." },
        { status: 400 }
      );
    }

    if (!session_date) {
      return NextResponse.json(
        { error: "Session date is required." },
        { status: 400 }
      );
    }

    if (!location?.trim()) {
      return NextResponse.json(
        { error: "Location is required." },
        { status: 400 }
      );
    }

    const { rows } = await pool.query(
      `
      INSERT INTO public.sessions (name, session_date, location)
      VALUES ($1, $2::date, $3)
      RETURNING id, name, session_date, location
      `,
      [name.trim(), session_date, location.trim()]
    );

    return NextResponse.json({ session: rows[0] }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}