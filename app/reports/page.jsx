"use client";
import { useEffect, useMemo, useState } from "react";

export default function ReportsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mailTo, setMailTo] = useState("");

  async function load() {
    setLoading(true);
    const qs = new URLSearchParams();
    if (from) qs.set("from", from);
    if (to)   qs.set("to", to);
    const res = await fetch(`/api/reports/sessions?${qs.toString()}`);
    const data = await res.json();
    setRows(data.rows || []);
    setLoading(false);
  }

  function csvHref() {
    const qs = new URLSearchParams();
    if (from) qs.set("from", from);
    if (to)   qs.set("to", to);
    qs.set("format", "csv");
    return `/api/reports/sessions?${qs.toString()}`;
  }

  async function sendEmail() {
    const qs = new URLSearchParams();
    if (from) qs.set("from", from);
    if (to)   qs.set("to", to);
    const res = await fetch(`/api/reports/email?${qs.toString()}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: mailTo })
    });
    const out = await res.json();
    alert(out.ok ? "Email sent" : `Failed: ${out.error}`);
  }

  useEffect(() => { load(); }, []); // initial

  return (
    <main style={{ maxWidth: 1000, margin: "32px auto", padding: 16 }}>
      <h1>Reports</h1>
      <div style={{ display:"flex", gap:12, alignItems:"end", marginBottom:16 }}>
        <label>From<br/><input type="date" value={from} onChange={e=>setFrom(e.target.value)} /></label>
        <label>To<br/><input type="date" value={to} onChange={e=>setTo(e.target.value)} /></label>
        <button onClick={load} disabled={loading}>{loading ? "Loading..." : "Run"}</button>
        <a href={csvHref()} download className="btn">Download CSV</a>
      </div>

      <div style={{ display:"flex", gap:8, alignItems:"center", margin:"8px 0 16px" }}>
        <input placeholder="email@example.com" value={mailTo} onChange={e=>setMailTo(e.target.value)} />
        <button onClick={sendEmail} disabled={!mailTo}>Email Report</button>
      </div>

      <div style={{ overflowX:"auto" }}>
        <table style={{ borderCollapse:"collapse", width:"100%" }}>
          <thead>
            <tr>
              {["session_id","session_name","speech_id","speaker","speech_title","created_at","green","yellow","red","elapsed_seconds"].map(h=>(
                <th key={h} style={{ textAlign:"left", borderBottom:"1px solid #ccc", padding:"8px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r,i)=>(
              <tr key={i}>
                <td style={{ padding:"6px" }}>{r.session_id}</td>
                <td style={{ padding:"6px" }}>{r.session_name}</td>
                <td style={{ padding:"6px" }}>{r.speech_id}</td>
                <td style={{ padding:"6px" }}>{r.speaker}</td>
                <td style={{ padding:"6px" }}>{r.speech_title}</td>
                <td style={{ padding:"6px" }}>{r.created_at}</td>
                <td style={{ padding:"6px" }}>{r.green}</td>
                <td style={{ padding:"6px" }}>{r.yellow}</td>
                <td style={{ padding:"6px" }}>{r.red}</td>
                <td style={{ padding:"6px" }}>{r.elapsed_seconds}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
