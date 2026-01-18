"use client";

import { useState } from "react";

export default function NewSpeechForm({ onReady }) {
  const [sessionName, setSessionName] = useState("");
  const [speakerId, setSpeakerId] = useState("");
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
      const sid = session?.id;
      if (!sid) {
        throw new Error("No active session. Create a session first.");
      }
      const res = await fetch(`/api/sessions/${sid}/speeches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
        speaker_id: Number(speakerId),
        title: nextSpeechTitle.trim() || null,
        elapsed_seconds: 0,
        greenSeconds: Number(nextGreen),
        yellowSeconds: Number(nextYellow),
        redSeconds: Number(nextRed),
      })
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
        <label>Session Name
        <select
          required
          value={speakerId}
          onChange={(e) => setSpeakerId(e.target.value)}
        >
          <option value="">-- Select speaker --</option>
          {participants.map((p) => (
            <option key={p.id} value={String(p.id)}>
              {p.name}{p.title_position ? ` — ${p.title_position}` : ""}
            </option>
          ))}
        </select>
      </label>

      <label>Speaker Name*
        <input required value={speakerId} onChange={e=>setspeakerId(e.target.value)} placeholder="Jane Doe" />
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
