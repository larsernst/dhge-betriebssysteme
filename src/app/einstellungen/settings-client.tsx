"use client";

import { useState } from "react";

export default function SettingsClient({ initialMcqEnabled }: { initialMcqEnabled: boolean }) {
  const [mcqEnabled, setMcqEnabled] = useState(initialMcqEnabled);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function toggle(next: boolean) {
    setMcqEnabled(next);
    setSaved(false);
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mcqEnabled: next }),
    });
    setSaving(false);
    if (res.ok) setSaved(true);
  }

  return (
    <div className="stack">
      <div className="row row--between" style={{ flexWrap: "wrap" }}>
        <div>
          <strong>Multiple-Choice-Aufgaben</strong>
          <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>
            Wenn aktiviert, werden „Nennen…"-Fragen als Mehrfachauswahl angezeigt.
            Wenn deaktiviert, werden alle Fragen als freie Erinnerung behandelt.
          </p>
        </div>
        <label className="switch">
          <input
            type="checkbox"
            checked={mcqEnabled}
            onChange={(e) => void toggle(e.target.checked)}
            disabled={saving}
          />
          <span className="switch__track" aria-hidden="true">
            <span className="switch__thumb" />
          </span>
        </label>
      </div>
      {saved && <span className="badge badge--success">Gespeichert</span>}
    </div>
  );
}