import { pool } from "@/lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/reports?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(req) {
  const url = new URL(req.url);
  const from = url.searchParams.get("from"); // YYYY-MM-DD
  const to   = url.searchParams.get("to");   // YYYY-MM-DD

  // default: last 30 days (inclusive)
  const today = new Date();
  const dTo = to ? new Date(to + "T23:59:59.999Z")
                 : new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59, 999));
  const dFrom = from ? new Date(from + "T00:00:00.000Z")
                     : new Date(dTo.getTime() - 29 * 24 * 60 * 60 * 1000); // 30-day window

  try {
    const { rows } = await pool.query(
      `
      SELECT
        se.id            AS session_id,
        se.name          AS session_name,
        s.id             AS speech_id,
        p.name           AS speaker,
        s.title          AS speech_title,
        s.created_at,
        tp.green_seconds AS green,
        tp.yellow_seconds AS yellow,
        tp.red_seconds   AS red,
        s.elapsed_seconds
      FROM speeches s
      LEFT JOIN sessions se        ON se.id = s.session_id
      LEFT JOIN participants p     ON p.id = s.speaker_id
      LEFT JOIN timing_presets tp  ON tp.speech_id = s.id
      WHERE s.created_at BETWEEN $1 AND $2
      ORDER BY s.created_at DESC, s.id DESC
      `,
      [dFrom.toISOString(), dTo.toISOString()]
    );

    return Response.json({ rows, from: dFrom.toISOString(), to: dTo.toISOString() }, { status: 200 });
  } catch (e) {
    console.error("REPORTS ERROR:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
