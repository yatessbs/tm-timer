import { pool } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req, { params }) {
  const id = Number(params.id);
  if (!id) return Response.json({ error: "Invalid speech id" }, { status: 400 });

  const { elapsedSeconds } = await req.json();
  if (typeof elapsedSeconds !== "number" || elapsedSeconds < 0) {
    return Response.json({ error: "elapsedSeconds must be a non-negative number" }, { status: 400 });
  }

  try {
    const { rowCount } = await pool.query(
      "UPDATE speeches SET elapsed_seconds = $1 WHERE id = $2",
      [elapsedSeconds, id]
    );
    if (rowCount === 0) return Response.json({ error: "Speech not found" }, { status: 404 });
    return Response.json({ ok: true }, { status: 200 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
