import { pool } from "@/lib/db";

export const runtime = "nodejs";

function rowsToCsv(rows) {
  if (!rows?.length) return "session_id,session_name,speech_id,speaker,speech_title,created_at,green,yellow,red,elapsed_seconds\n";
  const header = Object.keys(rows[0]).join(",");
  const body = rows.map(r => Object.values(r).map(v => {
    if (v == null) return "";
    const s = String(v);
    // escape commas/quotes/newlines
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  }).join(",")).join("\n");
  return `${header}\n${body}\n`;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");  // e.g., 2025-11-01
  const to = searchParams.get("to");      // e.g., 2025-11-30
  const format = (searchParams.get("format") || "json").toLowerCase();

  // Simple date filtering on sessions.created_at (or started_at)
  const params = [];
  let where = "WHERE 1=1";
  if (from) { params.push(from); where += ` AND s.started_at >= $${params.length}`; }
  if (to)   { params.push(to);   where += ` AND s.started_at <  $${params.length}`; }

  const sql = `
    SELECT
      s.id                AS session_id,
      s.name              AS session_name,
      sp.id               AS speech_id,
      p.name              AS speaker,
      sp.title            AS speech_title,
      sp.created_at       AS created_at,
      tp.green_seconds    AS green,
      tp.yellow_seconds   AS yellow,
      tp.red_seconds      AS red,
      sp.elapsed_seconds  AS elapsed_seconds
    FROM sessions s
    LEFT JOIN speeches sp       ON sp.session_id = s.id
    LEFT JOIN participants p    ON p.id = sp.speaker_id
    LEFT JOIN timing_presets tp ON tp.speech_id = sp.id
    ${where}
    ORDER BY s.started_at DESC, sp.created_at ASC;
  `;

  try {
    const { rows } = await pool.query(sql, params);

    if (format === "csv") {
      const csv = rowsToCsv(rows);
      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="tm-timer-report.csv"`
        }
      });
    }

    return Response.json({ rows }, { status: 200 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
