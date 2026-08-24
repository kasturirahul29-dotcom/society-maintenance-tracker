"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/client";

export default function SettingsPage() {
  const [hours, setHours] = useState(48);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ overdueThresholdHours: number }>("/api/admin/settings")
      .then((data) => setHours(data.overdueThresholdHours))
      .catch(() => setError("Could not load settings"));
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      const data = await api<{ overdueThresholdHours: number }>("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({ overdueThresholdHours: hours }),
      });
      setHours(data.overdueThresholdHours);
      setMessage("Overdue threshold saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="display text-4xl">Settings</h1>
      <p className="mt-2 text-muted">
        Complaints that stay unresolved past this window are marked overdue on the dashboard and
        filters.
      </p>
      <form onSubmit={onSubmit} className="panel mt-6 space-y-4 rounded-2xl p-6">
        {error && <p className="text-sm text-clay">{error}</p>}
        {message && <p className="text-sm text-moss">{message}</p>}
        <label className="block text-sm">
          Overdue threshold (hours)
          <input
            type="number"
            min={1}
            max={720}
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2"
          />
        </label>
        <button className="rounded-full bg-moss px-4 py-2 text-white">Save</button>
      </form>
    </div>
  );
}
