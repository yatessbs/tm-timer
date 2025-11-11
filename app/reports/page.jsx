"use client";

import { useMemo, useState } from "react";

function todayStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

export default function ReportsPage() {
  // dates and inputs
  const [from, setFrom] = useState(todayStr());
  const [to, setTo] = useState(todayStr());
  const [email, setEmail] = useState("");

  // data / state
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // fetch rows for the selected date range
  async function load() {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ from, to }).toString();
      const res = await fetch(`/api/reports?${qs}`, { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setRows(data.rows ?? []);
    } catch (e) {
      alert(`Load failed: ${e.message}`);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  // computed helpers
  const qs = useMemo(() => new URLSearchParams({ from, to }).toString(), [from, to]);
  const downloadHref = `/api/reports/download?${qs}`;
  const canEmail = /\S+@\S+\.\S+/.test(email);
  const hasRows = rows.length > 0;

  // send CSV via email (server builds CSV and emails via Resend)
  async function sendEmail() {
    try {
      const res = await fetch(`/api/reports/email?${qs}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: email }) // IMPORTANT: property name must be "to"
      });
      if (!res.ok) throw new Error(await res.text());
      alert("Email sent.");
    } catch (e) {
      alert(`Email failed: ${e.message}`);
    }
  }

  return (
    <main style={{ maxWidth: 1000, margin: "32px auto", padding: 16 }}>
      <h1>Reports</h1>

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
        <div>
          <div>From</div>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} />
        </div>
        <div>
          <div>To</div>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} />
        </div>

        <button onClick={load} disabled={loading} style={{ height: 28 }}>
          {loading ? "Loading..." : "Load"}
        </button>

        {hasRows ? (
          <a href={downloadHref} download={`tm-report_${from}_to_${to}.csv`} style={{ marginLeft: 8 }}>
            Download CSV
          </a>
        ) : (
          <span style={{ marginLeft: 8, opacity: 0.5 }}>Download CSV</span>
        )}

        <input
          type="email"
          placeholder="email@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ marginLeft: 12 }}
        />
        <button onClick={sendEmail} disabled={!canEmail || !hasRows}>
          Email Report
        </button>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {[
              "session_id",
              "session_name",
              "speech_id",
              "speaker",
              "speech_title",
              "created_at",
              "green",
              "yellow",
              "red",
              "elapsed_seconds",
            ].map((h) => (
              <th key={h} style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "6px 4px" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td style={{ padding: "6px 4px" }}>{r.session_id}</td>
              <td style={{ padding: "6px 4px" }}>{r.session_name}</td>
              <td style={{ padding: "6px 4px" }}>{r.speech_id}</td>
              <td style={{ padding: "6px 4px" }}>{r.speaker}</td>
              <td style={{ padding: "6px 4px" }}>{r.speech_title}</td>
              <td style={{ padding: "6px 4px" }}>{r.created_at}</td>
              <td style={{ padding: "6px 4px" }}>{r.green}</td>
              <td style={{ padding: "6px 4px" }}>{r.yellow}</td>
              <td style={{ padding: "6px 4px" }}>{r.red}</td>
              <td style={{ padding: "6px 4px" }}>{r.elapsed_seconds}</td>
            </tr>
          ))}
          {!hasRows && !loading && (
            <tr>
              <td colSpan={10} style={{ padding: 12, opacity: 0.7 }}>
                No rows for this range.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
