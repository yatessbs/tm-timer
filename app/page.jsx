import Timer from "@/components/Timer";

export default function Home() {
  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
      <h1>Toastmasters Timer</h1>
      <p style={{ opacity:.8, marginBottom:16 }}>
        Next.js on Vercel • Neon Postgres connected via <code>/api/db-test</code>
      </p>
      <Timer />
    </main>
  );
}
