"use client";

import { useEffect, useRef, useState } from "react";

export default function Timer({ speechId }) {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const tickRef = useRef(null);

  useEffect(() => {
    if (running) {
      tickRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [running]);

  function start() { setRunning(true); }
  function pause() { setRunning(false); }
  function reset() { setRunning(false); setSeconds(0); }

  async function stopAndSave() {
    setRunning(false);

    if (!speechId) {
      alert("No speechId set.");
      return;
    }

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
      <div style={{ fontSize: 48, fontVariantNumeric: "tabular-nums" }}>
        {mm}:{ss}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {!running ? (
          <button onClick={start}>Start</button>
        ) : (
          <button onClick={pause}>Pause</button>
        )}
        <button onClick={reset} disabled={running}>Reset</button>
        <button onClick={stopAndSave} disabled={seconds === 0}>Stop &amp; Save</button>
      </div>

      <small>
        Speech ID: <b>{speechId ?? "—"}</b>
      </small>
    </section>
  );
}
