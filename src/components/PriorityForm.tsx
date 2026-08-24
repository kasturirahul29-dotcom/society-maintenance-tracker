"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";

type Priority = "LOW" | "MEDIUM" | "HIGH";

export function PriorityForm({
  complaintId,
  currentPriority,
}: {
  complaintId: string;
  currentPriority: Priority;
}) {
  const router = useRouter();

  const [priority, setPriority] =
    useState<Priority>(currentPriority);

  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function save() {
    setPending(true);
    setMessage("");
    setError("");

    try {
      await api(`/api/complaints/${complaintId}/priority`, {
        method: "PATCH",
        body: JSON.stringify({
          priority,
        }),
      });

      setMessage("Priority updated.");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not update priority",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-4 space-y-3">
      <select
        value={priority}
        onChange={(event) =>
          setPriority(event.target.value as Priority)
        }
        disabled={pending}
        className="w-full rounded-xl border border-line bg-white px-3 py-2"
      >
        <option value="LOW">Low</option>
        <option value="MEDIUM">Medium</option>
        <option value="HIGH">High</option>
      </select>

      <button
        type="button"
        onClick={save}
        disabled={pending || priority === currentPriority}
        className="rounded-full bg-moss px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Saving..." : "Save priority"}
      </button>

      {message && (
        <p className="text-sm text-moss">
          {message}
        </p>
      )}

      {error && (
        <p className="text-sm text-clay">
          {error}
        </p>
      )}
    </div>
  );
}