import Timer from "@/components/Timer";

export default function Home() {
  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
      <h1>Toastmasters Timer</h1>
      <p style={{ opacity:.8, marginBottom:16 }}>
        A Yates Enterprise Solutions project.
      </p>
      <Timer speechId={1} />
    </main>
  );
}
