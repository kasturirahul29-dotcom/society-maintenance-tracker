import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getOverdueThresholdHours, isOverdue } from "@/lib/settings";
import { PriorityBadge, StatusBadge } from "@/components/Badges";

export default async function AdminDashboardPage() {
  await requireAdmin();
  const overdueHours = await getOverdueThresholdHours();

  const [
    statusGroups,
    priorityGroups,
    categoryGroups,
    recent,
    residents,
    notices,
    unresolved,
  ] = await Promise.all([
    prisma.complaint.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),

    prisma.complaint.groupBy({
      by: ["priority"],
      _count: { _all: true },
    }),

    prisma.complaint.groupBy({
      by: ["categoryId"],
      _count: { _all: true },
    }),

    prisma.complaint.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        createdBy: true,
      },
    }),

    prisma.user.count({
      where: { role: "RESIDENT" },
    }),

    prisma.notice.count(),

    prisma.complaint.findMany({
      where: {
        status: { not: "RESOLVED" },
      },
      select: {
        createdAt: true,
        status: true,
        priority: true,
      },
    }),
  ]);

  const statusCounts = {
    OPEN: 0,
    IN_PROGRESS: 0,
    RESOLVED: 0,
  };

  for (const row of statusGroups) {
    statusCounts[row.status] = row._count._all;
  }

  const priorityCounts = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
  };

  for (const row of priorityGroups) {
    priorityCounts[row.priority] = row._count._all;
  }

  const categories = await prisma.category.findMany({
    where: {
      id: {
        in: categoryGroups.map((row) => row.categoryId),
      },
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      sortOrder: "asc",
    },
  });

  const categoryCounts = categories.map((category) => {
    const group = categoryGroups.find(
      (row) => row.categoryId === category.id,
    );

    return {
      id: category.id,
      name: category.name,
      count: group?._count._all ?? 0,
    };
  });

  const overdue = unresolved.filter((row) =>
    isOverdue(
      row.createdAt,
      row.status,
      overdueHours,
    ),
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-moss">
            Operations
          </p>

          <h1 className="display text-4xl">
            Admin dashboard
          </h1>
        </div>

        <div className="flex gap-2">
          <Link
            href="/admin/categories"
            className="rounded-full border border-line px-4 py-2 text-sm"
          >
            Categories
          </Link>

          <Link
            href="/admin/notices"
            className="rounded-full bg-moss px-4 py-2 text-sm text-white"
          >
            Post notice
          </Link>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          label="Residents"
          value={residents}
        />

        <Card
          label="Open"
          value={statusCounts.OPEN}
        />

        <Card
          label="In progress"
          value={statusCounts.IN_PROGRESS}
        />

        <Card
          label="Overdue"
          value={overdue.length}
          accent
        />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card
          label="High priority"
          value={priorityCounts.HIGH}
        />

        <Card
          label="Resolved"
          value={statusCounts.RESOLVED}
        />

        <Card
          label="Notices"
          value={notices}
        />
      </section>

      <section className="panel rounded-2xl p-5">
        <div className="mb-4">
          <h2 className="display text-2xl">
            Complaints by category
          </h2>

          <p className="mt-1 text-sm text-muted">
            Current complaint volume across maintenance categories.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categoryCounts.map((category) => (
            <div
              key={category.id}
              className="rounded-xl border border-line bg-white p-4"
            >
              <div className="text-sm text-muted">
                {category.name}
              </div>

              <div className="display mt-1 text-3xl">
                {category.count}
              </div>
            </div>
          ))}

          {categoryCounts.length === 0 && (
            <p className="text-sm text-muted">
              No complaint categories have data yet.
            </p>
          )}
        </div>
      </section>

      <section className="panel rounded-2xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="display text-2xl">
            Latest tickets
          </h2>

          <Link
            href="/complaints"
            className="text-sm text-moss"
          >
            Filter all
          </Link>
        </div>

        <div className="space-y-3">
          {recent.map((item) => (
            <Link
              key={item.id}
              href={`/complaints/${item.id}`}
              className="block rounded-xl border border-line bg-white px-4 py-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">
                  {item.ticketNo} · {item.createdBy.name}
                </span>

                <div className="flex gap-2">
                  {isOverdue(
                    item.createdAt,
                    item.status,
                    overdueHours,
                  ) && (
                    <span className="badge bg-clay/15 text-clay">
                      Overdue
                    </span>
                  )}

                  <PriorityBadge
                    priority={item.priority}
                  />

                  <StatusBadge
                    status={item.status}
                  />
                </div>
              </div>

              <p className="text-sm text-muted">
                {item.category.name}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function Card({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={`panel rounded-2xl p-5 ${
        accent ? "border-clay" : ""
      }`}
    >
      <div className="text-sm text-muted">
        {label}
      </div>

      <div className="display text-4xl">
        {value}
      </div>
    </div>
  );
}