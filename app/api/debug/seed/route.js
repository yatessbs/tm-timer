import { pool } from "@/lib/db";

export const runtime = "nodejs";

export async function POST() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: sRows } = await client.query(
      "INSERT INTO sessions (name) VALUES ($1) RETURNING id, name, started_at",
      ["Test Session"]
    );
    const sessionId = sRows[0].id;

    // simple speaker
    const { rows: pRows } = await client.query(
      "INSERT INTO participants (name) VALUES ($1) RETURNING id, name",
      ["Test Speaker"]
    );
    const speakerId = pRows[0].id;

    const { rows: speechRows } = await client.query(
      "INSERT INTO speeches (session_id, speaker_id, title) VALUES ($1,$2,$3) RETURNING id, session_id, title",
      [sessionId, speakerId, "Hello World"]
    );
    const speechId = speechRows[0].id;

    await client.query(
      "INSERT INTO timing_presets (speech_id, green_seconds, yellow_seconds, red_seconds) VALUES ($1,$2,$3,$4)",
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
