import TimerHost from "@/components/TimerHost";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Home() {
  return (
    <main style={{ maxWidth: 800, margin: "40px auto", padding: 16 }}>
      <h1>Toastmasters Timer</h1>
      <TimerHost />
    </main>
  );
}
