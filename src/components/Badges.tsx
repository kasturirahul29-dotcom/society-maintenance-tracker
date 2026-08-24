"use client";

import type { ComplaintStatus, Priority } from "@prisma/client";

export function StatusBadge({ status }: { status: ComplaintStatus }) {
  const map = {
    OPEN: "bg-gold/15 text-gold",
    IN_PROGRESS: "bg-moss/15 text-moss-deep",
    RESOLVED: "bg-ink/10 text-ink",
  };
  const labels = { OPEN: "Open", IN_PROGRESS: "In progress", RESOLVED: "Resolved" };
  return <span className={`badge ${map[status]}`}>{labels[status]}</span>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const map = {
    LOW: "bg-moss/10 text-moss",
    MEDIUM: "bg-gold/15 text-ink",
    HIGH: "bg-clay/15 text-clay",
  };
  return <span className={`badge ${map[priority]}`}>{priority}</span>;
}
