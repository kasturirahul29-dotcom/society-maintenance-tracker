import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { forbidden, notFound } from "@/lib/errors";
import { ok, withHandler } from "@/lib/api";
import { getOverdueThresholdHours } from "@/lib/settings";
import { serializeComplaint } from "@/lib/serialize";

const include = {
  category: true,
  createdBy: { select: { id: true, name: true, email: true, unitNumber: true } },
  assignedTo: { select: { id: true, name: true, email: true } },
  history: {
    include: { actor: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: "asc" as const },
  },
};

export const GET = withHandler(async (_request, context) => {
  const user = await requireUser();
  const { id } = await context.params;
  const complaint = await prisma.complaint.findUnique({
    where: { id },
    include,
  });
  if (!complaint) throw notFound("Complaint not found");
  if (user.role !== "ADMIN" && complaint.createdById !== user.id) {
    throw forbidden();
  }
  return ok(serializeComplaint(complaint, await getOverdueThresholdHours()));
});
