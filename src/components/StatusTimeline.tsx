"use client";

import type { ComplaintDto } from "@/lib/types";

export function StatusTimeline({ history }: { history: NonNullable<ComplaintDto["history"]> }) {
  return (
    <ol className="space-y-4">
      {history.map((event, index) => (
        <li key={event.id} className="relative pl-6">
          {index !== history.length - 1 && (
            <span className="absolute top-5 left-[7px] h-full w-px bg-line" />
          )}
          <span className="absolute top-1.5 left-0 h-3.5 w-3.5 rounded-full border-2 border-moss bg-paper" />
          <div className="text-sm font-medium">
            {event.fromStatus ? `${label(event.fromStatus)} → ${label(event.toStatus)}` : label(event.toStatus)}
          </div>
          <div className="text-xs text-muted">
            {event.actor.name} · {new Date(event.createdAt).toLocaleString()}
          </div>
          {event.note && <p className="mt-1 text-sm">{event.note}</p>}
        </li>
      ))}
    </ol>
  );
}

function label(status: string) {
  if (status === "IN_PROGRESS") return "In progress";
  return status.charAt(0) + status.slice(1).toLowerCase();
}
