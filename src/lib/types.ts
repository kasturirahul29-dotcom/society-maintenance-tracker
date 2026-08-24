import type { ComplaintStatus, Priority, Role } from "@prisma/client";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  unitNumber: string | null;
  phone: string | null;
};

export type ComplaintDto = {
  id: string;
  ticketNo: string;
  description: string;
  photoUrl: string | null;
  priority: Priority;
  status: ComplaintStatus;
  category: { id: string; name: string };
  createdBy: { id: string; name: string; email: string; unitNumber: string | null };
  assignedTo: { id: string; name: string; email: string } | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  isOverdue: boolean;
  overdueAt: string;
  history?: {
    id: string;
    fromStatus: ComplaintStatus | null;
    toStatus: ComplaintStatus;
    note: string | null;
    createdAt: string;
    actor: { id: string; name: string; role: Role };
  }[];
};

export type NoticeDto = {
  id: string;
  title: string;
  body: string;
  isPinned: boolean;
  isImportant: boolean;
  publishedAt: string;
  expiresAt: string | null;
  createdBy: { id: string; name: string };
};

export type CategoryDto = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  _count?: { complaints: number };
};

export type DashboardDto = {
  overdueThresholdHours: number;
  totals: {
    residents: number;
    notices: number;
    complaints: number;
    overdue: number;
    overdueHigh: number;
  };
  statusCounts: Record<ComplaintStatus, number>;
  priorityCounts: Record<Priority, number>;
  recent: ComplaintDto[];
};
