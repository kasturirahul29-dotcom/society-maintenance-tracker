import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { badRequest, notFound } from "@/lib/errors";
import { ok, parseJson, withHandler } from "@/lib/api";
import { getOverdueThresholdHours } from "@/lib/settings";
import { serializeComplaint } from "@/lib/serialize";
import { z } from "zod";

const prioritySchema = z.object({
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
});

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
  history: {
    include: {
      actor: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc" as const,
    },
  },
};

export const PATCH = withHandler(async (request, context) => {
  await requireAdmin();

  const { id } = await context.params;
  const body = await parseJson(request, prioritySchema);

  const existing = await prisma.complaint.findUnique({
    where: { id },
  });

  if (!existing) {
    throw notFound("Complaint not found");
  }

  if (existing.priority === body.priority) {
    throw badRequest("Priority is already set to this value");
  }

  const complaint = await prisma.complaint.update({
    where: { id },
    data: {
      priority: body.priority,
    },
    include,
  });

  return ok(
    serializeComplaint(
      complaint,
      await getOverdueThresholdHours(),
    ),
  );
});