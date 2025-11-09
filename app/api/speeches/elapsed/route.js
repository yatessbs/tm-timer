import { pool } from "@/lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  const url = new URL(req.url);
  const id = parseInt(url.searchParams.get("id") || "", 10);
  if (!Number.isFinite(id) || id <= 0) {
    return Response.json({ error: "Invalid ?id" }, { status: 400 });
  }

  let body = {};
  try { body = await req.json(); } catch { /* ignore */ }
  const elapsedSeconds = Number(body?.elapsedSeconds);
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds < 0) {
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
    console.error("ELAPSED ERROR:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
