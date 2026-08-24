import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { ok, withRoute } from "@/lib/api";
import { getOverdueThresholdHours, isOverdue } from "@/lib/settings";
import { serializeComplaint } from "@/lib/serialize";

export const GET = withRoute(async () => {
  await requireAdmin();
  const overdueHours = await getOverdueThresholdHours();

  const [byStatus, byPriority, recent, totalUsers, openNotices] = await Promise.all([
    prisma.complaint.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.complaint.groupBy({ by: ["priority"], _count: { _all: true } }),
    prisma.complaint.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        createdBy: { select: { id: true, name: true, email: true, unitNumber: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.user.count({ where: { role: "RESIDENT" } }),
    prisma.notice.count({
      where: { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
    }),
  ]);

  const unresolved = await prisma.complaint.findMany({
    where: { status: { not: "RESOLVED" } },
    select: { createdAt: true, status: true, priority: true },
  });

  const overdue = unresolved.filter((row) => isOverdue(row.createdAt, row.status, overdueHours));
  const overdueHigh = overdue.filter((row) => row.priority === "HIGH").length;

  const statusCounts = { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0 };
  for (const row of byStatus) statusCounts[row.status] = row._count._all;

  const priorityCounts = { LOW: 0, MEDIUM: 0, HIGH: 0 };
  for (const row of byPriority) priorityCounts[row.priority] = row._count._all;

  return ok({
    overdueThresholdHours: overdueHours,
    totals: {
      residents: totalUsers,
      notices: openNotices,
      complaints: statusCounts.OPEN + statusCounts.IN_PROGRESS + statusCounts.RESOLVED,
      overdue: overdue.length,
      overdueHigh,
    },
    statusCounts,
    priorityCounts,
    recent: recent.map((row) => serializeComplaint(row, overdueHours)),
  });
});
