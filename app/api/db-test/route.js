import { pool } from "../../../lib/db";

export const runtime = "nodejs";      // ensure Node runtime (not Edge)
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { rows } = await pool.query("SELECT NOW() AS now");
    return new Response(JSON.stringify(rows[0]), {
      headers: { "Content-Type": "application/json" },
      status: 200
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
