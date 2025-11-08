import { pool } from "@/lib/db";

export const runtime = "nodejs";

function rowsToCsv(rows) {
  if (!rows?.length) return "session_id,session_name,speech_id,speaker,speech_title,created_at,green,yellow,red,elapsed_seconds\n";
  const header = Object.keys(rows[0]).join(",");
  const body = rows.map(r => Object.values(r).map(v => {
    if (v == null) return "";
    const s = String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  }).join(",")).join("\n");
  return `${header}\n${body}\n`;
}

export async function POST(request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const { to: emailTo } = await request.json();

  if (!emailTo) return Response.json({ error: "Missing 'to'." }, { status: 400 });

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
    const csv = rowsToCsv(rows);

    // Send with Resend (simple fetch; avoids adding a dep)
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "tm-timer@your-domain.com",   // or a verified sender
        to: [emailTo],
        subject: "TM Timer Report",
        text: "Attached is your CSV report.",
        attachments: [{
          filename: "tm-timer-report.csv",
          content: Buffer.from(csv, "utf8").toString("base64")
        }]
      })
    });

    if (!res.ok) {
      const err = await res.text();
      return Response.json({ error: err }, { status: 500 });
    }

    return Response.json({ ok: true }, { status: 200 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
