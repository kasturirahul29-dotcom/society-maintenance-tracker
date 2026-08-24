import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { badRequest, notFound } from "@/lib/errors";
import { ok, parseJson, withHandler } from "@/lib/api";
import { complaintStatusSchema } from "@/lib/validation";
import { getOverdueThresholdHours } from "@/lib/settings";
import { serializeComplaint } from "@/lib/serialize";
import { notifyUser } from "@/lib/mail";

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

export const POST = withHandler(async (request, context) => {
  const admin = await requireAdmin();
  const { id } = await context.params;

  const body = await parseJson(
    request,
    complaintStatusSchema,
  );

  const existing = await prisma.complaint.findUnique({
    where: { id },
  });

  if (!existing) {
    throw notFound("Complaint not found");
  }

  const nextAssignedToId =
    body.assignedToId === undefined
      ? existing.assignedToId
      : body.assignedToId;

  const statusChanged =
    existing.status !== body.status;

  const assignmentChanged =
    existing.assignedToId !== nextAssignedToId;

  if (!statusChanged && !assignmentChanged) {
    throw badRequest("No changes were made");
  }

  if (body.assignedToId) {
    const assignee = await prisma.user.findUnique({
      where: {
        id: body.assignedToId,
      },
      select: {
        role: true,
      },
    });

    if (!assignee || assignee.role !== "ADMIN") {
      throw badRequest(
        "Assignee must be an admin user",
      );
    }
  }

  const complaint = await prisma.complaint.update({
    where: { id },
    data: {
      assignedToId:
        body.assignedToId === undefined
          ? undefined
          : body.assignedToId,

      ...(statusChanged
        ? {
            status: body.status,
            resolvedAt:
              body.status === "RESOLVED"
                ? new Date()
                : null,

            history: {
              create: {
                fromStatus: existing.status,
                toStatus: body.status,
                note: body.note ?? null,
                actorId: admin.id,
              },
            },
          }
        : {}),
    },
    include,
  });

  if (statusChanged) {
    void notifyUser(
      existing.createdById,
      `Complaint ${existing.ticketNo} is now ${body.status
        .replace("_", " ")
        .toLowerCase()}`,
      [
        `Your complaint ${existing.ticketNo} was updated by ${admin.name}.`,
        `New status: ${body.status}`,
        body.note
          ? `Note: ${body.note}`
          : null,
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }

  return ok(
    serializeComplaint(
      complaint,
      await getOverdueThresholdHours(),
    ),
  );
});