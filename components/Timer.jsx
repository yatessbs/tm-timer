"use client";

import { useEffect, useRef, useState } from "react";

export default function Timer({ speechId }) {
  const [currentSpeechId, setCurrentSpeechId] = useState(speechId ?? null);
  const [seconds, setSeconds] = useState(0);
  const [session, setSession] = useState(null);
  const [sessionName, setSessionName] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [sessionLocation, setSessionLocation] = useState("");

  const [participants, setParticipants] = useState([]);
  const [running, setRunning] = useState(false);

  // thresholds loaded from DB
  const [green, setGreen]   = useState(300);
  const [yellow, setYellow] = useState(360);
  const [red, setRed]       = useState(420);
  const [nextSpeakerId, setNextSpeakerId] = useState("");
  const [nextSpeechTitle, setNextSpeechTitle] = useState("");
  const [nextGreen, setNextGreen] = useState(300);
  const [nextYellow, setNextYellow] = useState(360);
  const [nextRed, setNextRed] = useState(420);
  const [creatingNext, setCreatingNext] = useState(false);

  const tickRef = useRef(null);
  const lastPhaseRef = useRef("none");
  const pulseTimeoutRef = useRef(null);
  const [pulseOn, setPulseOn] = useState(false);
  // load presets for this speech
  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!currentSpeechId) return;
      try {
        const res = await fetch(`/api/speeches/presets?id=${currentSpeechId}`, { cache: "no-store" });
        if (!res.ok) return;
        const p = await res.json();
        if (!ignore) {
          const g = Number(p.green_seconds ?? 300);
          const y = Number(p.yellow_seconds ?? 360);
          const r = Number(p.red_seconds ?? 420);

          setGreen(g);
          setYellow(y);
          setRed(r);

          // default next speech gates to the same values
          setNextGreen(g);
          setNextYellow(y);
          setNextRed(r);
        }
      } catch {}
    }
    load();
    return () => { ignore = true; };
  }, [currentSpeechId]);

  async function loadParticipants() {
  const res = await fetch("/api/participants", { cache: "no-store" });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? "Failed to load participants.");
  setParticipants(data.participants ?? []);
}

useEffect(() => {
  loadParticipants().catch((e) => console.error(e));
  }, []);

  async function createSession() {
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
  }
  
  // start/stop ticking
  useEffect(() => {
    if (running) {
      tickRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [running]);

  function start() { setRunning(true); }
  function pause() { setRunning(false); }
  function reset() {
    setRunning(false);
    setSeconds(0);
    setNextSpeakerId("");
    setNextSpeechTitle("");

    setPulseOn(false);
    lastPhaseRef.current = "none";
    if (pulseTimeoutRef.current) {
      clearTimeout(pulseTimeoutRef.current);
      pulseTimeoutRef.current = null;
    }
  }

  // compute visual phase
  const phase =
    seconds >= red ? "red" :
    seconds >= yellow ? "yellow" :
    seconds >= green ? "green" : "none";

  const overtime = seconds > red;
  const bg =
    phase === "red"    ? (overtime ? "#ffdddd" : "#ffd6d6") :
    phase === "yellow" ? "#fff5cc" :
    phase === "green"  ? "#e8ffe8" : "#f6f6f6";

    useEffect(() => {
    const prev = lastPhaseRef.current;
    const curr = phase;

    if (curr !== "none" && curr !== prev) {
      if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
      setPulseOn(true);
      pulseTimeoutRef.current = setTimeout(() => setPulseOn(false), 5000);
    }

    lastPhaseRef.current = curr;
  }, [phase]);
  // optional subtle blink when overtime
  const bannerStyle = {
  padding: 10,
  borderRadius: 10,
  background: bg,
  border: "1px solid #ddd",
  };

  // Save
  async function createNextSpeech() {
  if (!nextSpeakerId) {
    alert("Select the next speaker.");
    return;
  }

  setCreatingNext(true);
  try {
    const sid = session?.id;
    if (!sid) {
      throw new Error("No active session. Create a session first.");
    }
    const res = await fetch(`/api/sessions/${sid}/speeches`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        speaker_id: Number(nextSpeakerId),
        title: nextSpeechTitle.trim() || null,
        elapsed_seconds: 0,
        greenSeconds: Number(nextGreen),
        yellowSeconds: Number(nextYellow),
        redSeconds: Number(nextRed),
      }),
    });

    const data = await res.json();

if (!res.ok) {
  throw new Error(data?.error ?? `Create speech failed (${res.status})`);
}

// Accept either { speech: { id } } OR { speechId }
const newSpeechId = data?.speech?.id ?? data?.speechId;
if (!newSpeechId) {
  throw new Error("Create speech succeeded but no speech id was returned.");
    }

    // Switch Timer to the new speechId
    setCurrentSpeechId(newSpeechId);

    // Reset timer for the new speech
    setRunning(false);
    setSeconds(0);

    // Apply gates immediately (so the big timer + thresholds match the new speech)
    setGreen(Number(nextGreen));
    setYellow(Number(nextYellow));
    setRed(Number(nextRed));

    // Reset the clock
    setRunning(false);
    setSeconds(0);

    alert(`Next speech ready. Speech ID: ${data.speechId}`);
  } catch (e) {
    alert(e.message || String(e));
  } finally {
    setCreatingNext(false);
  }
}
  async function stopAndSave() {
    setRunning(false);
    if (!speechId) { alert("No speechId set."); return; }

    try {
      const res = await fetch(`/api/speeches/elapsed?id=${speechId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ elapsedSeconds: seconds }),
      });
      if (!res.ok) {
        const text = await res.text();
        alert(`Save failed (${res.status}): ${text}`);
        return;
      }
      alert("Elapsed time saved.");
    } catch (e) {
      alert(`Network error: ${e.message}`);
    }
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <section
      style={{
        display: "grid",
        gap: 12,
        padding: 12,
        borderRadius: 12,
        background: bg, // optional: makes the whole panel take the phase color
        ...(pulseOn ? { animation: "gateBlink 0.6s steps(1,end) infinite" } : {}),
      }}
  >
      {/* color banner */}
      <div style={bannerStyle}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
          <strong>
            {phase === "red" ? "RED" : phase === "yellow" ? "YELLOW" : phase === "green" ? "GREEN" : "READY"}
            {overtime ? " — OVERTIME" : ""}
          </strong>
          <small>
            G:{green}s&nbsp; Y:{yellow}s&nbsp; R:{red}s
          </small>
        </div>
      </div>

      {/* big clock */}
      <div style={{ fontSize: 64, fontVariantNumeric: "tabular-nums", textAlign: "center" }}>
        {mm}:{ss}
      </div>

      {/* controls */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        {!running ? (
          <button onClick={start}>Start</button>
        ) : (
          <button onClick={pause}>Pause</button>
        )}
        <button onClick={reset} disabled={running}>Reset</button>
        <button onClick={stopAndSave} disabled={seconds === 0}>Stop &amp; Save</button>
      </div>
      
      {/* Next Speech panel (appears when timer is reset / not running) */}
      {!running && seconds === 0 ? (
        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12, display: "grid", gap: 10 }}>
          <strong>Next Speech</strong>

          <input
            placeholder="Next speaker name"
            value={nextSpeakerId}
            onChange={(e) => setNextSpeakerId(e.target.value)}
          />

          <input
            placeholder="Next speech title (optional)"
            value={nextSpeechTitle}
            onChange={(e) => setNextSpeechTitle(e.target.value)}
          />

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <label>
              Green (s)
              <input
                type="number"
                value={nextGreen}
                onChange={(e) => setNextGreen(Number(e.target.value || 0))}
                style={{ width: 90, marginLeft: 6 }}
              />
            </label>

            <label>
              Yellow (s)
              <input
                type="number"
                value={nextYellow}
                onChange={(e) => setNextYellow(Number(e.target.value || 0))}
                style={{ width: 90, marginLeft: 6 }}
              />
            </label>

            <label>
              Red (s)
              <input
                type="number"
                value={nextRed}
                onChange={(e) => setNextRed(Number(e.target.value || 0))}
                style={{ width: 90, marginLeft: 6 }}
              />
            </label>
          </div>

          <button onClick={createNextSpeech} disabled={!nextSpeakerId.trim() || creatingNext}>
            {creatingNext ? "Creating..." : "Create Next Speech"}
          </button>
        </div>
      ) : null}

      <style>{`
        @keyframes gateBlink { 50% { opacity: 0.25; } }
        button { padding: 8px 12px; border-radius: 8px; border: 1px solid #bbb; background:#fff; cursor:pointer; }
        button:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      <small>Speech ID: <b>{currentSpeechId ?? "—"}</b></small>
    </section>
  );
}
