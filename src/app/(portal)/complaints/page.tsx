import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getOverdueThresholdHours, isOverdue } from "@/lib/settings";
import { PriorityBadge, StatusBadge } from "@/components/Badges";
import { ComplaintFilters } from "@/components/ComplaintFilters";
import type { ComplaintStatus, Priority } from "@prisma/client";

function isValidDateInput(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export default async function ComplaintsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  const status =
    typeof params.status === "string" ? params.status : "";

  const priority =
    typeof params.priority === "string" ? params.priority : "";

  const categoryId =
    typeof params.categoryId === "string"
      ? params.categoryId
      : "";

  const overdue =
    typeof params.overdue === "string" ? params.overdue : "";

  const search =
    typeof params.search === "string" ? params.search : "";

  const fromDate =
    typeof params.fromDate === "string" &&
    isValidDateInput(params.fromDate)
      ? params.fromDate
      : "";

  const toDate =
    typeof params.toDate === "string" &&
    isValidDateInput(params.toDate)
      ? params.toDate
      : "";

  const overdueHours = await getOverdueThresholdHours();

  const categories = await prisma.category.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      sortOrder: "asc",
    },
  });

  const where = {
    ...(user.role === "ADMIN"
      ? {}
      : {
          createdById: user.id,
        }),

    ...(status
      ? {
          status: status as ComplaintStatus,
        }
      : {}),

    ...(priority
      ? {
          priority: priority as Priority,
        }
      : {}),

    ...(categoryId
      ? {
          categoryId,
        }
      : {}),

    ...(search
      ? {
          OR: [
            {
              ticketNo: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              description: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),

    ...(fromDate || toDate
      ? {
          createdAt: {
            ...(fromDate
              ? {
                  gte: new Date(
                    `${fromDate}T00:00:00.000Z`,
                  ),
                }
              : {}),

            ...(toDate
              ? {
                  lte: new Date(
                    `${toDate}T23:59:59.999Z`,
                  ),
                }
              : {}),
          },
        }
      : {}),
  };

  const rows = await prisma.complaint.findMany({
    where,
    include: {
      category: true,
      createdBy: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const items = rows.filter((row) => {
    const late = isOverdue(
      row.createdAt,
      row.status,
      overdueHours,
    );

    if (overdue === "true") {
      return late;
    }

    if (overdue === "false") {
      return !late;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="display text-4xl">
            Complaints
          </h1>

          <p className="text-muted">
            {items.length} matching tickets
          </p>
        </div>

        <Link
          href="/complaints/new"
          className="rounded-full bg-clay px-5 py-2.5 text-white"
        >
          New complaint
        </Link>
      </div>

      <ComplaintFilters categories={categories} />

      <div className="space-y-3">
        {items.length === 0 && (
          <div className="panel rounded-2xl p-8 text-muted">
            No complaints match these filters.
          </div>
        )}

        {items.map((item) => (
          <Link
            key={item.id}
            href={`/complaints/${item.id}`}
            className="panel block rounded-2xl p-5 hover:border-moss"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-semibold">
                  {item.ticketNo}
                </div>

                <div className="text-sm text-muted">
                  {item.category.name}

                  {user.role === "ADMIN"
                    ? ` · ${item.createdBy.name}`
                    : ""}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
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

            <p className="mt-2 text-sm">
              {item.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}