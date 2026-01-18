import { pool } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req) {
  const body = await req.json().catch(() => ({}));

  const {
    sessionId,        // REQUIRED now
    speakerId,        // REQUIRED (or speakerName depending on your design)
    title,            // optional
    greenSeconds,
    yellowSeconds,
    redSeconds
  } = body;

  if (!sessionId) {
    return Response.json(
      { error: "sessionId is required. Create a session first." },
      { status: 400 }
    );
  }

  if (!speakerId) {
    return Response.json(
      { error: "speakerId is required." },
      { status: 400 }
    );
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const sp = await client.query(
      "INSERT INTO speeches(session_id, speaker_id, title) VALUES ($1,$2,$3) RETURNING id",
      [Number(sessionId), Number(speakerId), title ?? null]
    );

    const speechId = sp.rows[0].id;

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
    return Response.json({ sessionId: Number(sessionId), speechId }, { status: 201 });
  } catch (e) {
    await client.query("ROLLBACK");
    return Response.json({ error: e.message }, { status: 500 });
  } finally {
    client.release();
  }
}