"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function LoginForm() {
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/reports";

  async function submit(e) {
    e.preventDefault();
    setErr("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ password })
    });
    if (res.ok) router.push(next);
    else setErr((await res.json()).error || "Login failed");
  }

  return (
    <main style={{ maxWidth: 420, margin: "64px auto", padding: 16 }}>
      <h1>Reports Login</h1>
      <form onSubmit={submit} style={{ display:"grid", gap:12, marginTop:12 }}>
        <input
          type="password"
          placeholder="Passcode"
          value={password}
          onChange={e=>setPassword(e.target.value)}
        />
        <button type="submit">Sign in</button>
        {err && <div style={{ color:"crimson" }}>{err}</div>}
      </form>
    </main>
  );
}
