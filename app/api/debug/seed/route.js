import { pool } from "@/lib/db";

export const runtime = "nodejs";

export async function POST() {
  const client = await pool.connect();

  // Simple defaults for seeding
  const sessionName = "Test Session";
  const sessionDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const sessionLocation = "TBD";

  const speakerName = "Test Speaker";

  try {
    await client.query("BEGIN");

    // 1) Create session (NOW requires date + location)
    const { rows: sRows } = await client.query(
      `INSERT INTO sessions (name, session_date, location)
       VALUES ($1, $2::date, $3)
       RETURNING id, name, started_at, session_date, location`,
      [sessionName, sessionDate, sessionLocation]
    );
    const sessionId = sRows[0].id;

    // 2) Create participant (speaker)
    const { rows: pRows } = await client.query(
      `INSERT INTO participants (name)
       VALUES ($1)
       RETURNING id, name`,
      [speakerName]
    );
    const speakerId = pRows[0].id;

    // 3) Create speech
    const { rows: speechRows } = await client.query(
      `INSERT INTO speeches (session_id, speaker_id, title)
       VALUES ($1, $2, $3)
       RETURNING id, session_id, title`,
      [sessionId, speakerId, "Hello World"]
    );
    const speechId = speechRows[0].id;

    // 4) Timing presets (optional)
    await client.query(
      `INSERT INTO timing_presets (speech_id, green_seconds, yellow_seconds, red_seconds)
       VALUES ($1, $2, $3, $4)`,
      [speechId, 300, 360, 420]
    );

    await client.query("COMMIT");
    return Response.json({ sessionId, speechId }, { status: 201 });
  } catch (e) {
    await client.query("ROLLBACK");
    return Response.json({ error: e.message }, { status: 500 });
  } finally {
    client.release();
  }
}