import { Pool } from "pg";

const g = globalThis;

const pool =
  g.__pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
  });

if (!g.__pgPool) {
  g.__pgPool = pool;

  // Auto-migrate: add public_id and pin columns if they don't exist yet.
  pool.query(`
    ALTER TABLE public.sessions
      ADD COLUMN IF NOT EXISTS public_id UUID DEFAULT gen_random_uuid(),
      ADD COLUMN IF NOT EXISTS pin VARCHAR(6);
    UPDATE public.sessions SET public_id = gen_random_uuid() WHERE public_id IS NULL;
    UPDATE public.sessions SET pin = LPAD((FLOOR(RANDOM() * 1000000))::int::text, 6, '0') WHERE pin IS NULL;
  `).catch((e) => console.error("[db] auto-migrate failed:", e.message));
}

export { pool };
export default pool;