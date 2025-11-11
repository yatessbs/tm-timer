import { pool } from "@/lib/db";
export const runtime = "nodejs";

function toISOStart(d) { return new Date(`${d}T00:00:00Z`).toISOString(); }
function toISOEnd(d)   { return new Date(`${d}T00:00:00Z`).toISOString(); }

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

export async function POST(request) {
  const url  = new URL(request.url);
  const from = url.searchParams.get("from"); // YYYY-MM-DD
  const to   = url.searchParams.get("to");   // YYYY-MM-DD
  const { to: emailTo } = await request.json().catch(() => ({}));

  if (!emailTo) return Response.json({ error: "Missing 'to'." }, { status: 400 });
  if (!process.env.RESEND_API_KEY) return Response.json({ error: "Missing RESEND_API_KEY" }, { status: 500 });

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

  // Send via Resend REST API
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: "reports@your-verified-domain.com",   // change to your verified sender
      to: [emailTo],
      subject: `TM Timer Report ${from || ""} ${to || ""}`.trim(),
      text: rows.length ? "CSV report attached." : "No rows for the selected range.",
      attachments: [{
        filename: `tm-report_${from||"all"}_${to||"all"}.csv`,
        content: Buffer.from(csv, "utf8").toString("base64")
      }]
    })
  });

  if (!res.ok) {
    const err = await res.text();
    return Response.json({ error: err }, { status: 502 });
  }

  return Response.json({ ok: true, rows: rows.length }, { status: 200 });
}
