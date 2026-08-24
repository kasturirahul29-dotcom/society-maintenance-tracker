import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { badRequest } from "@/lib/errors";
import { ok, withRoute } from "@/lib/api";
import {
  complaintCreateSchema,
  complaintQuerySchema,
} from "@/lib/validation";
import { saveComplaintPhoto } from "@/lib/upload";
import { nextTicketNo } from "@/lib/tickets";
import { getOverdueThresholdHours } from "@/lib/settings";
import { serializeComplaint } from "@/lib/serialize";
import { notifyAdmins } from "@/lib/mail";

const include = {
  category: true,
  createdBy: {
    select: {
      id: true,
      name: true,
      email: true,
      unitNumber: true,
    },
  },
  assignedTo: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} as const;

export const GET = withRoute(async (request) => {
  const user = await requireUser();
  const url = new URL(request.url);

  const query = complaintQuerySchema.parse(
    Object.fromEntries(url.searchParams),
  );

  const overdueHours = await getOverdueThresholdHours();

  const where: Prisma.ComplaintWhereInput = {};

  if (user.role !== "ADMIN") {
    where.createdById = user.id;
  }

  if (query.status) {
    where.status = query.status;
  }

  if (query.priority) {
    where.priority = query.priority;
  }

  if (query.categoryId) {
    where.categoryId = query.categoryId;
  }

  if (query.search) {
    where.OR = [
      {
        ticketNo: {
          contains: query.search,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: query.search,
          mode: "insensitive",
        },
      },
    ];
  }

  // Date filtering
  if (query.fromDate || query.toDate) {
    where.createdAt = {};

    if (query.fromDate) {
      where.createdAt.gte = new Date(
        `${query.fromDate}T00:00:00.000Z`,
      );
    }

    if (query.toDate) {
      where.createdAt.lte = new Date(
        `${query.toDate}T23:59:59.999Z`,
      );
    }
  }

  const rows = await prisma.complaint.findMany({
    where,
    include,
    orderBy: [{ createdAt: "desc" }],
  });

  let filtered = rows.map((row) =>
    serializeComplaint(row, overdueHours),
  );

  if (query.overdue === "true") {
    filtered = filtered.filter((row) => row.isOverdue);
  }

  if (query.overdue === "false") {
    filtered = filtered.filter((row) => !row.isOverdue);
  }

  const start = (query.page - 1) * query.pageSize;
  const data = filtered.slice(start, start + query.pageSize);

  return ok({
    items: data,
    page: query.page,
    pageSize: query.pageSize,
    total: filtered.length,
    overdueThresholdHours: overdueHours,
  });
});

export const POST = withRoute(async (request) => {
  const user = await requireUser();

  const contentType = request.headers.get("content-type") ?? "";

  let payload: {
    categoryId: string;
    description: string;
    priority: "LOW" | "MEDIUM" | "HIGH";
  };

  let photo: File | null = null;

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();

    payload = complaintCreateSchema.parse({
      categoryId: form.get("categoryId"),
      description: form.get("description"),
      priority: form.get("priority") || "MEDIUM",
    });

    const file = form.get("photo");
    photo = file instanceof File ? file : null;
  } else {
    payload = complaintCreateSchema.parse(
      await request.json(),
    );
  }

  const category = await prisma.category.findUnique({
    where: { id: payload.categoryId },
  });

  if (!category || !category.isActive) {
    throw badRequest("Choose a valid complaint category");
  }

  const photoUrl = await saveComplaintPhoto(photo);
  const ticketNo = await nextTicketNo();

  const complaint = await prisma.complaint.create({
    data: {
      ticketNo,
      categoryId: payload.categoryId,
      description: payload.description,
      priority: payload.priority,
      photoUrl,
      createdById: user.id,
      history: {
        create: {
          fromStatus: null,
          toStatus: "OPEN",
          note: "Complaint registered.",
          actorId: user.id,
        },
      },
    },
    include,
  });

  const overdueHours = await getOverdueThresholdHours();

  await notifyAdmins(
    `New complaint ${complaint.ticketNo}`,
    `${user.name} (${user.unitNumber ?? "no unit"}) filed a ${payload.priority.toLowerCase()} priority ${category.name} complaint:\n\n${payload.description}`,
  );

  return ok(
    serializeComplaint(complaint, overdueHours),
    201,
  );
});