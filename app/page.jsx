// app/page.jsx
import Timer from "@/components/Timer";
import { pool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Home() {
  // grab the most recently created speech
  const { rows } = await pool.query(
    "SELECT id FROM speeches ORDER BY id DESC LIMIT 1"
  );
  const speechId = rows[0]?.id ?? null;

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
      <h1>Toastmasters Timer</h1>
      {speechId ? (
        <Timer speechId={speechId} />
      ) : (
        <p>No speeches yet. Create one (or run /api/debug/seed once) and refresh.</p>
      )}
    </main>
  );
}
