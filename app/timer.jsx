"use client";
import { useEffect, useMemo, useRef, useState } from "react";

export default function Timer({ green = 300, yellow = 360, red = 420 }) {
  // ---------------------------
  // Timer state (your original)
  // ---------------------------
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [g, setG] = useState(green);
  const [y, setY] = useState(yellow);
  const [r, setR] = useState(red);
  const intervalRef = useRef(null);
  const lastGateRef = useRef(null);
  const pulseTimeoutRef = useRef(null);

  const [pulseGate, setPulseGate] = useState(null); // "green" | "yellow" | "red" | null
  const [pulseOn, setPulseOn] = useState(false);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => intervalRef.current && clearInterval(intervalRef.current);
  }, [running]);

  const bg =
    seconds >= r
      ? "#b00020"
      : seconds >= y
      ? "#e0a800"
      : seconds >= g
      ? "#1e7e34"
      : "#0a0a0a";

  const gate =
    seconds >= r ? "red" :
    seconds >= y ? "yellow" :
    seconds >= g ? "green" :
    null;

  const pulseAnim =
    gate === "red" ? "yes-pulse 0.75s infinite" :
    gate === "yellow" ? "yes-pulse 0.9s infinite" :
    gate === "green" ? "yes-pulse 1s infinite" :
    "none";

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  useEffect(() => {
  const prev = lastGateRef.current;
  const curr = gate;

  // Trigger only when ENTERING a new gate
  if (curr && curr !== prev) {
    if (pulseTimeoutRef.current) {
      clearTimeout(pulseTimeoutRef.current);
    }

    setPulseGate(curr);
    setPulseOn(true);

    pulseTimeoutRef.current = setTimeout(() => {
      setPulseOn(false);
    }, 5000);
  }

  lastGateRef.current = curr;
}, [gate]);

  // ---------------------------
  // New: Session state
  // ---------------------------
  const [session, setSession] = useState(null);
  const [sessionName, setSessionName] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [sessionLocation, setSessionLocation] = useState("");

  const canCreateSession = useMemo(() => {
    return sessionName.trim() && sessionDate && sessionLocation.trim();
  }, [sessionName, sessionDate, sessionLocation]);

  // ---------------------------
  // New: Participants (speakers)
  // ---------------------------
  const [participants, setParticipants] = useState([]);
  const [speakerId, setSpeakerId] = useState("");

  // Add-speaker modal fields
  const [speakerModalOpen, setSpeakerModalOpen] = useState(false);
  const [newSpeakerName, setNewSpeakerName] = useState("");
  const [newSpeakerEmail, setNewSpeakerEmail] = useState("");
  const [newSpeakerTitlePosition, setNewSpeakerTitlePosition] = useState("");

  // ---------------------------
  // New: Speech entry fields
  // ---------------------------
  const [speechTitle, setSpeechTitle] = useState(""); // title of the speech
  const [speeches, setSpeeches] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadParticipants() {
    const res = await fetch("/api/participants", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error ?? "Failed to load participants.");
    setParticipants(data.participants ?? []);
  }

  async function loadSpeeches(sessionId) {
    const res = await fetch(`/api/sessions/${sessionId}/speeches`, { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error ?? "Failed to load speeches.");
    setSpeeches(data.speeches ?? []);
  }

  useEffect(() => {
    (async () => {
      try {
        await loadParticipants();
      } catch (e) {
        setError(e.message || String(e));
      }
    })();
  }, []);

  useEffect(() => {
    if (!session?.id) return;
    (async () => {
      try {
        await loadSpeeches(session.id);
      } catch (e) {
        setError(e.message || String(e));
      }
    })();
  }, [session?.id]);

  async function createSession() {
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: sessionName,
          session_date: sessionDate,
          location: sessionLocation,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to create session.");
      setSession(data.session);
      // Optional: default speaker selection after session starts
      if (!speakerId && participants.length) setSpeakerId(String(participants[0].id));
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setSaving(false);
    }
  }

  async function createSpeaker() {
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSpeakerName,
          email: newSpeakerEmail,
          title_position: newSpeakerTitlePosition,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to create participant.");

      await loadParticipants();
      setSpeakerId(String(data.participant.id));

      // close + reset
      setSpeakerModalOpen(false);
      setNewSpeakerName("");
      setNewSpeakerEmail("");
      setNewSpeakerTitlePosition("");
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setSaving(false);
    }
  }

  async function saveCurrentSpeech() {
    if (!session?.id) {
      setError("Create a session first.");
      return;
    }
    if (!speakerId) {
      setError("Select a speaker first.");
      return;
    }

    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/sessions/${session.id}/speeches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          speaker_id: Number(speakerId),
          title: speechTitle.trim() || null,
          elapsed_seconds: seconds,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to save speech.");

      await loadSpeeches(session.id);

      // Reset timer for next speech
      setRunning(false);
      setSeconds(0);
      setSpeechTitle("");
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setSaving(false);
    }
  }

  const activeSpeaker = useMemo(() => {
    const id = Number(speakerId);
    return participants.find((p) => p.id === id) || null;
  }, [speakerId, participants]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <style>{`
        @keyframes yes-blink {
          0%   { opacity: 1; }
          50%  { opacity: 0.35; }
          100% { opacity: 1; }
        }
`}</style>
      <style>{`
        @keyframes yes-pulse {
          0% { opacity: 1; }
          50% { opacity: 0.55; }
          100% { opacity: 1; }
      }
`}</style>
      {/* Error banner */}
      {error ? (
        <div style={{ padding: 10, borderRadius: 10, background: "#2b0b0b", color: "#fff" }}>
          {error}
        </div>
      ) : null}

      {/* Step 1: Session */}
      <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12, display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 700 }}>Session</div>

        <div style={{ display: "grid", gap: 8 }}>
          <input
            placeholder="Session name"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            disabled={!!session?.id}
          />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              disabled={!!session?.id}
              style={{ minWidth: 180 }}
            />
            <input
              placeholder="Location"
              value={sessionLocation}
              onChange={(e) => setSessionLocation(e.target.value)}
              disabled={!!session?.id}
              style={{ flex: 1, minWidth: 220 }}
            />
          </div>

          {!session?.id ? (
            <button onClick={createSession} disabled={!canCreateSession || saving}>
              {saving ? "Working..." : "Start Session"}
            </button>
          ) : (
            <div style={{ fontSize: 14, color: "#333" }}>
              Active: <strong>{session.name}</strong> ({session.session_date}) @ {session.location}
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Speech entry controls */}
      <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12, display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 700 }}>Current Speech</div>

        {!session?.id ? (
          <div style={{ color: "#555" }}>Create a session to begin adding speeches.</div>
        ) : (
          <>
            <input
              placeholder="Speech title"
              value={speechTitle}
              onChange={(e) => setSpeechTitle(e.target.value)}
            />

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <select value={speakerId} onChange={(e) => setSpeakerId(e.target.value)} style={{ minWidth: 280 }}>
                <option value="">-- Select speaker --</option>
                {participants.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.name}
                    {p.title_position ? ` — ${p.title_position}` : ""}
                  </option>
                ))}
              </select>

              <button type="button" onClick={() => setSpeakerModalOpen(true)} disabled={saving}>
                Add Speaker
              </button>
            </div>

            {activeSpeaker ? (
              <div style={{ fontSize: 13, color: "#444" }}>
                Speaker details:{" "}
                <strong>{activeSpeaker.name}</strong>
                {activeSpeaker.title_position ? ` | ${activeSpeaker.title_position}` : ""}
                {activeSpeaker.email ? ` | ${activeSpeaker.email}` : ""}
              </div>
            ) : null}

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <label>
                Green (s)
                <input type="number" value={g} onChange={(e) => setG(+e.target.value || 0)} style={{ width: 90 }} />
              </label>
              <label>
                Yellow (s)
                <input type="number" value={y} onChange={(e) => setY(+e.target.value || 0)} style={{ width: 90 }} />
              </label>
              <label>
                Red (s)
                <input type="number" value={r} onChange={(e) => setR(+e.target.value || 0)} style={{ width: 90 }} />
              </label>
            </div>
          </>
        )}
      </div>

      {/* Timer display */}
      <div
        style={{
          height: 240,
          borderRadius: 16,
          background: bg,
          animation: pulseOn
            ? pulseGate === "red"
              ? "yes-blink 0.35s steps(1,end) infinite"
              : pulseGate === "yellow"
              ? "yes-blink 0.45s steps(1,end) infinite"
              : "yes-blink 0.6s steps(1,end) infinite"
            : "none",
          display: "grid",
          placeItems: "center",
          color: "#fff",
          fontSize: 64,
          fontWeight: 700,
        }}
      >
        {mm}:{ss}
      </div>

      {/* Timer controls + Save speech */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => setRunning(true)} disabled={!session?.id}>Start</button>
        <button onClick={() => setRunning(false)} disabled={!session?.id}>Pause</button>
        <button
          onClick={() => {
            setSeconds(0);
            setRunning(false);
          }}
          disabled={!session?.id}
        >
          Reset
        </button>

        <button onClick={saveCurrentSpeech} disabled={!session?.id || !speakerId || saving}>
          {saving ? "Saving..." : "Save Speech (time)"}
        </button>
      </div>

      {/* Speech list */}
      {session?.id ? (
        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Session Speeches</div>
          <table width="100%" cellPadding="6" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th align="left">#</th>
                <th align="left">Speaker</th>
                <th align="left">Speech</th>
                <th align="left">Time</th>
              </tr>
            </thead>
            <tbody>
              {speeches.map((sp, idx) => {
                const t = Number(sp.elapsed_seconds ?? 0);
                const m = String(Math.floor(t / 60)).padStart(2, "0");
                const s = String(t % 60).padStart(2, "0");
                return (
                  <tr key={sp.id} style={{ borderTop: "1px solid #eee" }}>
                    <td>{idx + 1}</td>
                    <td>
                      {sp.speaker_name}
                      {sp.speaker_title_position ? ` — ${sp.speaker_title_position}` : ""}
                      {sp.speaker_email ? ` (${sp.speaker_email})` : ""}
                    </td>
                    <td>{sp.speech_title ?? ""}</td>
                    <td>{m}:{s}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* Add Speaker Modal */}
      {speakerModalOpen ? (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)" }}>
          <div style={{ background: "#fff", maxWidth: 520, margin: "10% auto", padding: 16, borderRadius: 12 }}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Add Speaker</div>

            <div style={{ display: "grid", gap: 8 }}>
              <input
                placeholder="Name (required)"
                value={newSpeakerName}
                onChange={(e) => setNewSpeakerName(e.target.value)}
              />
              <input
                placeholder="Email (optional)"
                value={newSpeakerEmail}
                onChange={(e) => setNewSpeakerEmail(e.target.value)}
              />
              <input
                placeholder="Title / Position (optional)"
                value={newSpeakerTitlePosition}
                onChange={(e) => setNewSpeakerTitlePosition(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={createSpeaker} disabled={!newSpeakerName.trim() || saving}>
                {saving ? "Working..." : "Save"}
              </button>
              <button onClick={() => setSpeakerModalOpen(false)} disabled={saving}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}