import { pool } from "@/lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const url = new URL(req.url);
  const id = parseInt(url.searchParams.get("id") || "", 10);
  if (!Number.isFinite(id)) return Response.json({ error: "Invalid id" }, { status: 400 });

  // fallbacks if no row exists
  const defaults = { green_seconds: 300, yellow_seconds: 360, red_seconds: 420 };

  const { rows } = await pool.query(
    "SELECT green_seconds, yellow_seconds, red_seconds FROM timing_presets WHERE speech_id = $1 LIMIT 1",
    [id]
  );
  const data = rows[0] ?? defaults;
  return Response.json(data, { status: 200 });
}
