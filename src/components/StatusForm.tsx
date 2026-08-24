"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import type { ComplaintStatus } from "@prisma/client";
import { api } from "@/lib/client";

export function StatusForm({
  complaintId,
  currentStatus,
  assignedToId,
  staff,
}: {
  complaintId: string;
  currentStatus: ComplaintStatus;
  assignedToId: string | null;
  staff: { id: string; name: string }[];
}) {
  const router = useRouter();

  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setPending(true);
    setError("");

    const form = new FormData(event.currentTarget);

    const status = form.get("status") as ComplaintStatus;

    const assignedValue = form.get("assignedToId");

    const nextAssignedToId =
      typeof assignedValue === "string" && assignedValue
        ? assignedValue
        : null;

    const assignmentChanged =
      nextAssignedToId !== assignedToId;

    const statusChanged =
      status !== currentStatus;

    if (!statusChanged && !assignmentChanged) {
      setError("No changes were made.");
      setPending(false);
      return;
    }

    try {
      await api(`/api/complaints/${complaintId}/status`, {
        method: "POST",
        body: JSON.stringify({
          status,
          note: form.get("note") || undefined,
          assignedToId: nextAssignedToId,
        }),
      });

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Update failed",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-4 space-y-3"
    >
      {error && (
        <p className="text-sm text-clay">
          {error}
        </p>
      )}

      <select
        name="status"
        defaultValue={currentStatus}
        className="w-full rounded-xl border border-line bg-white px-3 py-2"
      >
        <option value="OPEN">Open</option>
        <option value="IN_PROGRESS">In progress</option>
        <option value="RESOLVED">Resolved</option>
      </select>

      <select
        name="assignedToId"
        defaultValue={assignedToId ?? ""}
        className="w-full rounded-xl border border-line bg-white px-3 py-2"
      >
        <option value="">Unassigned</option>

        {staff.map((person) => (
          <option
            key={person.id}
            value={person.id}
          >
            {person.name}
          </option>
        ))}
      </select>

      <textarea
        name="note"
        rows={3}
        placeholder="Note for the history log"
        className="w-full rounded-xl border border-line bg-white px-3 py-2"
      />

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-moss px-4 py-2 text-white disabled:opacity-60"
      >
        {pending ? "Saving..." : "Record change"}
      </button>
    </form>
  );
}