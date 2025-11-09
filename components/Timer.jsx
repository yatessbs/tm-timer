async function stopAndSave() {
  setRunning(false);

  if (!speechId) {
    alert("No speechId set. Create a speech first (seed or UI).");
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
