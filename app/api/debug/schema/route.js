import { pool } from "@/lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const client = await pool.connect();
  try {
    // 1) list user tables in "public"
    const { rows: tables } = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    const out = {};

    for (const { table_name } of tables) {
      // columns
      const { rows: cols } = await client.query(`
        SELECT
          c.column_name,
          c.data_type,
          c.is_nullable,
          c.column_default
        FROM information_schema.columns c
        WHERE c.table_schema = 'public' AND c.table_name = $1
        ORDER BY c.ordinal_position;
      `, [table_name]);

      // primary key columns
      const { rows: pks } = await client.query(`
        SELECT a.attname AS column_name
        FROM   pg_index i
        JOIN   pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        JOIN   pg_class t ON t.oid = i.indrelid
        JOIN   pg_namespace n ON n.oid = t.relnamespace
        WHERE  i.indisprimary
          AND  n.nspname = 'public'
          AND  t.relname = $1
        ORDER BY a.attnum;
      `, [table_name]);

      // foreign keys
      const { rows: fks } = await client.query(`
        SELECT
          tc.constraint_name,
          kcu.column_name,
          ccu.table_name AS foreign_table,
          ccu.column_name AS foreign_column
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
         AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
         AND ccu.table_schema = tc.table_schema
        WHERE tc.table_schema = 'public'
          AND tc.table_name = $1
          AND tc.constraint_type = 'FOREIGN KEY'
        ORDER BY tc.constraint_name, kcu.ordinal_position;
      `, [table_name]);

      out[table_name] = {
        columns: cols,
        primaryKey: pks.map(x => x.column_name),
        foreignKeys: fks
      };
    }

    return Response.json(out, { status: 200 });
  } catch (e) {
    console.error("SCHEMA ERROR:", e);
    return Response.json({ error: e.message }, { status: 500 });
  } finally {
    client.release();
  }
}
