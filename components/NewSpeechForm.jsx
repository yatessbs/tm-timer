"use client";

import { useState } from "react";

export default function NewSpeechForm({ onReady }) {
  const [sessionName, setSessionName] = useState("");
  const [speakerName, setSpeakerName] = useState("");
  const [title, setTitle] = useState("");
  const [green, setGreen] = useState(300);
  const [yellow, setYellow] = useState(360);
  const [red, setRed] = useState(420);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function submit(e) {
    e.preventDefault();
    setMsg("");
    setBusy(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/speeches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          speaker_id: Number(speakerId),
          title,
          elapsed_seconds: 0,
          greenSeconds: Number(green),
          yellowSeconds: Number(yellow),
          redSeconds: Number(red),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setMsg("Created. Timer is ready.");
      onReady?.({ sessionId: data.sessionId, speechId: data.speechId });
    } catch (err) {
      setMsg(`Error: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 10, marginBottom: 16 }}>
      <h2>Create Speech</h2>

      <label>Session Name
        <input value={sessionName} onChange={e=>setSessionName(e.target.value)} placeholder="e.g., 2025-11-10 Club #1234" />
      </label>

      <label>Speaker Name*
        <input required value={speakerName} onChange={e=>setSpeakerName(e.target.value)} placeholder="Jane Doe" />
      </label>

      <label>Speech Title
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Icebreaker" />
      </label>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap: 10 }}>
        <label>Green (s)
          <input type="number" min={0} value={green} onChange={e=>setGreen(e.target.value)} />
        </label>
        <label>Yellow (s)
          <input type="number" min={0} value={yellow} onChange={e=>setYellow(e.target.value)} />
        </label>
        <label>Red (s)
          <input type="number" min={0} value={red} onChange={e=>setRed(e.target.value)} />
        </label>
      </div>

      <button type="submit" disabled={busy}>{busy ? "Creating…" : "Create & Arm Timer"}</button>
      {msg && <small>{msg}</small>}
    </form>
  );
}
