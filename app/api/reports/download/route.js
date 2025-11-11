import { pool } from "@/lib/db";
export const runtime = "nodejs";

function toISOStart(d) { return new Date(`${d}T00:00:00Z`).toISOString(); }
function toISOEnd(d)   { return new Date(`${d}T00:00:00Z`).toISOString(); } // exclusive; we add +1 day in SQL

function rowsToCsv(rows) {
  const headers = [
    "session_id","session_name","speech_id","speaker","speech_title",
    "created_at","green","yellow","red","elapsed_seconds"
  ];
  const esc = v => {
    if (v == null) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
  };
  return [
    headers.join(","),
    ...rows.map(r => headers.map(h => esc(r[h])).join(","))
  ].join("\n") + "\n";
}

export async function GET(req) {
  const url  = new URL(req.url);
  const from = url.searchParams.get("from"); // YYYY-MM-DD
  const to   = url.searchParams.get("to");   // YYYY-MM-DD

  const params = [];
  let where = "WHERE 1=1";
  if (from) { params.push(toISOStart(from)); where += ` AND sp.created_at >= $${params.length}`; }
  if (to)   { params.push(toISOEnd(to));     where += ` AND sp.created_at <  ($${params.length}::timestamptz + INTERVAL '1 day')`; }

  const { rows } = await pool.query(
    `
      SELECT
        sess.id            AS session_id,
        sess.name          AS session_name,
        sp.id              AS speech_id,
        p.name             AS speaker,
        sp.title           AS speech_title,
        sp.created_at,
        tp.green_seconds   AS green,
        tp.yellow_seconds  AS yellow,
        tp.red_seconds     AS red,
        sp.elapsed_seconds
      FROM speeches sp
      LEFT JOIN sessions      sess ON sess.id = sp.session_id
      LEFT JOIN participants  p    ON p.id    = sp.speaker_id
      LEFT JOIN timing_presets tp  ON tp.speech_id = sp.id
      ${where}
      ORDER BY sp.created_at DESC, sp.id DESC
    `,
    params
  );

  const csv = rowsToCsv(rows);
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tm-report_${from||"all"}_${to||"all"}.csv"`
    }
  });
}
