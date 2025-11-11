"use client";

import { useEffect, useRef, useState } from "react";

export default function Timer({ speechId }) {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);

  // thresholds loaded from DB
  const [green, setGreen]   = useState(300);
  const [yellow, setYellow] = useState(360);
  const [red, setRed]       = useState(420);

  const tickRef = useRef(null);

  // load presets for this speech
  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!speechId) return;
      try {
        const res = await fetch(`/api/speeches/presets?id=${speechId}`, { cache: "no-store" });
        if (!res.ok) return;
        const p = await res.json();
        if (!ignore) {
          setGreen(Number(p.green_seconds ?? 300));
          setYellow(Number(p.yellow_seconds ?? 360));
          setRed(Number(p.red_seconds ?? 420));
        }
      } catch {}
    }
    load();
    return () => { ignore = true; };
  }, [speechId]);

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
  function reset() { setRunning(false); setSeconds(0); }

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

  // optional subtle blink when overtime
  const bannerStyle = {
    padding: 10,
    borderRadius: 10,
    background: bg,
    border: "1px solid #ddd",
    ...(overtime ? { animation: "blink 1s step-start 0s infinite" } : {})
  };

  // Save
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
    <section style={{ display: "grid", gap: 12 }}>
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

      <style>{`
        @keyframes blink { 50% { opacity: 0.5; } }
        button { padding: 8px 12px; border-radius: 8px; border: 1px solid #bbb; background:#fff; cursor:pointer; }
        button:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      <small>Speech ID: <b>{speechId ?? "—"}</b></small>
    </section>
  );
}
