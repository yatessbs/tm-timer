"use client";

import { useState } from "react";
import NewSpeechForm from "@/components/NewSpeechForm";
import Timer from "@/components/Timer";

export default function TimerHost() {
  const [speechId, setSpeechId] = useState(null);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {!speechId && <NewSpeechForm onReady={({ speechId }) => setSpeechId(speechId)} />}
      {speechId ? (
        <section>
          <h2>Timer</h2>
          <Timer speechId={speechId} />
        </section>
      ) : (
        <p>Fill out the form to arm the timer.</p>
      )}
    </div>
  );
}
