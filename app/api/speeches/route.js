import { pool } from "@/lib/db";
export const runtime = "nodejs";

export async function POST(req) {
  const body = await req.json().catch(() => ({}));

  const {
    // Either give us an existing sessionId OR a name to create one:
    sessionId,
    sessionName,

    speakerName,           // required
    title,                 // optional
    greenSeconds,          // optional int
    yellowSeconds,         // optional int
    redSeconds             // optional int
  } = body;

  if (!speakerName) {
    return Response.json({ error: "speakerName is required" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1) Resolve session id
    let sid = sessionId ?? null;
    if (!sid) {
      const s = await client.query(
        `INSERT INTO sessions (name, session_date, location)
        VALUES ($1, $2::date, $3)
        RETURNING id`,
        [
          sessionName || "Toastmasters Session",
          new Date().toISOString().slice(0, 10), // YYYY-MM-DD
          "TBD",
        ]
      );
      sid = s.rows[0].id;
    }

    // 2) Resolve participant (note: no unique constraint on name in your schema)
    //    We'll reuse an exact name match if present; else insert a new participant row.
    let speakerId;
    const existing = await client.query(
      "SELECT id FROM participants WHERE name = $1 LIMIT 1",
      [speakerName]
    );
    if (existing.rowCount) {
      speakerId = existing.rows[0].id;
    } else {
      const ins = await client.query(
        "INSERT INTO participants(name) VALUES ($1) RETURNING id",
        [speakerName]
      );
      speakerId = ins.rows[0].id;
    }

    // 3) Create speech
    const sp = await client.query(
      "INSERT INTO speeches(session_id, speaker_id, title) VALUES ($1,$2,$3) RETURNING id",
      [sid, speakerId, title ?? null]
    );
    const speechId = sp.rows[0].id;

    // 4) Optional timing presets
    if (
      Number.isFinite(Number(greenSeconds)) &&
      Number.isFinite(Number(yellowSeconds)) &&
      Number.isFinite(Number(redSeconds))
    ) {
      await client.query(
        "INSERT INTO timing_presets(speech_id, green_seconds, yellow_seconds, red_seconds) VALUES ($1,$2,$3,$4)",
        [speechId, Number(greenSeconds), Number(yellowSeconds), Number(redSeconds)]
      );
    }

    await client.query("COMMIT");
    return Response.json({ sessionId: sid, speechId }, { status: 201 });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("CREATE SPEECH ERROR:", e);
    return Response.json({ error: e.message }, { status: 500 });
  } finally {
    client.release();
  }
}
