"use client";
import { useEffect, useRef, useState } from "react";

export default function Timer({ green=300, yellow=360, red=420 }) {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [g, setG] = useState(green);
  const [y, setY] = useState(yellow);
  const [r, setR] = useState(red);
  const [title, setTitle] = useState("");
  const [speaker, setSpeaker] = useState("");
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => intervalRef.current && clearInterval(intervalRef.current);
  }, [running]);

  const bg =
    seconds >= r ? "#b00020" :        // red
    seconds >= y ? "#e0a800" :        // yellow
    seconds >= g ? "#1e7e34" :        // green
    "#0a0a0a";                        // neutral

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div style={{ display:"grid", gap:16 }}>
      <div style={{ display:"grid", gap:8 }}>
        <input placeholder="Speech title" value={title} onChange={e=>setTitle(e.target.value)} />
        <input placeholder="Speaker name" value={speaker} onChange={e=>setSpeaker(e.target.value)} />
        <div style={{ display:"flex", gap:8 }}>
          <label>Green (s)<input type="number" value={g} onChange={e=>setG(+e.target.value||0)} style={{ width:90 }}/></label>
          <label>Yellow (s)<input type="number" value={y} onChange={e=>setY(+e.target.value||0)} style={{ width:90 }}/></label>
          <label>Red (s)<input type="number" value={r} onChange={e=>setR(+e.target.value||0)} style={{ width:90 }}/></label>
        </div>
      </div>

      <div style={{
        height: 240, borderRadius: 16, background:bg,
        display:"grid", placeItems:"center", color:"#fff", fontSize:64, fontWeight:700
      }}>
        {mm}:{ss}
      </div>

      <div style={{ display:"flex", gap:8 }}>
        <button onClick={()=>setRunning(true)}>Start</button>
        <button onClick={()=>setRunning(false)}>Pause</button>
        <button onClick={()=>{ setSeconds(0); setRunning(false); }}>Reset</button>
      </div>
    </div>
  );
}
