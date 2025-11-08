import { Pool } from "pg";

const g = globalThis;
export const pool =
  g.__pgPool ?? new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });

if (!g.__pgPool) g.__pgPool = pool;
export default pool;
