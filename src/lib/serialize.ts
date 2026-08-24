import type { Complaint, ComplaintStatusHistory, User, Category } from "@prisma/client";
import { isOverdue, overdueSince } from "@/lib/settings";

type ComplaintWithRelations = Complaint & {
  category: Category;
  createdBy: Pick<User, "id" | "name" | "email" | "unitNumber">;
  assignedTo?: Pick<User, "id" | "name" | "email"> | null;
  history?: (ComplaintStatusHistory & {
    actor: Pick<User, "id" | "name" | "role">;
  })[];
};

export function serializeComplaint(
  complaint: ComplaintWithRelations,
  overdueHours: number,
) {
  return {
    id: complaint.id,
    ticketNo: complaint.ticketNo,
    description: complaint.description,
    photoUrl: complaint.photoUrl,
    priority: complaint.priority,
    status: complaint.status,
    category: {
      id: complaint.category.id,
      name: complaint.category.name,
    },
    createdBy: complaint.createdBy,
    assignedTo: complaint.assignedTo ?? null,
    createdAt: complaint.createdAt.toISOString(),
    updatedAt: complaint.updatedAt.toISOString(),
    resolvedAt: complaint.resolvedAt?.toISOString() ?? null,
    isOverdue: isOverdue(complaint.createdAt, complaint.status, overdueHours),
    overdueAt: overdueSince(complaint.createdAt, overdueHours).toISOString(),
    history: complaint.history?.map((event) => ({
      id: event.id,
      fromStatus: event.fromStatus,
      toStatus: event.toStatus,
      note: event.note,
      createdAt: event.createdAt.toISOString(),
      actor: event.actor,
    })),
  };
}
