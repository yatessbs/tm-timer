import { pool } from "@/lib/db";
export const runtime = "nodejs";

// POST /api/debug/migrate
// One-time migration: adds public_id (UUID) and pin columns to sessions table.
// Safe to run multiple times (uses IF NOT EXISTS / WHERE NULL guards).
export async function POST() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE public.sessions
        ADD COLUMN IF NOT EXISTS public_id UUID DEFAULT gen_random_uuid(),
        ADD COLUMN IF NOT EXISTS pin VARCHAR(6);
    `);

    // Back-fill any existing rows that have no public_id or pin
    await client.query(`
      UPDATE public.sessions
      SET public_id = gen_random_uuid()
      WHERE public_id IS NULL;
    `);

    await client.query(`
      UPDATE public.sessions
      SET pin = LPAD((FLOOR(RANDOM() * 1000000))::int::text, 6, '0')
      WHERE pin IS NULL;
    `);

    return Response.json({ ok: true, message: "Migration complete." }, { status: 200 });
  } catch (e) {
    console.error("MIGRATE ERROR:", e);
    return Response.json({ error: e.message }, { status: 500 });
  } finally {
    client.release();
  }
}
