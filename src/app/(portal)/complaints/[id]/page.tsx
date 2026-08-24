import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getOverdueThresholdHours, isOverdue } from "@/lib/settings";
import { PriorityBadge, StatusBadge } from "@/components/Badges";
import { StatusTimeline } from "@/components/StatusTimeline";
import { StatusForm } from "@/components/StatusForm";
import { PriorityForm } from "@/components/PriorityForm";

export default async function ComplaintDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const overdueHours = await getOverdueThresholdHours();

  const complaint = await prisma.complaint.findUnique({
    where: { id },
    include: {
      category: true,
      createdBy: true,
      assignedTo: true,
      history: {
        include: { actor: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!complaint) notFound();

  if (user.role !== "ADMIN" && complaint.createdById !== user.id) {
    notFound();
  }

  const staff =
    user.role === "ADMIN"
      ? await prisma.user.findMany({
          where: { role: "ADMIN" },
          select: { id: true, name: true },
        })
      : [];

  const late = isOverdue(
    complaint.createdAt,
    complaint.status,
    overdueHours,
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
      <div className="panel rounded-2xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted">
              {complaint.ticketNo}
            </p>

            <h1 className="display text-4xl">
              {complaint.category.name}
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            {late && (
              <span className="badge bg-clay/15 text-clay">
                Overdue
              </span>
            )}

            <PriorityBadge priority={complaint.priority} />

            <StatusBadge status={complaint.status} />
          </div>
        </div>

        <p className="mt-4 whitespace-pre-wrap">
          {complaint.description}
        </p>

        {complaint.photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={complaint.photoUrl}
            alt="Complaint attachment"
            className="mt-4 max-h-80 rounded-xl border border-line object-cover"
          />
        )}

        <dl className="mt-6 grid gap-2 text-sm text-muted sm:grid-cols-2">
          <div>
            <dt>Filed by</dt>
            <dd className="text-ink">
              {complaint.createdBy.name}
            </dd>
          </div>

          <div>
            <dt>Unit</dt>
            <dd className="text-ink">
              {complaint.createdBy.unitNumber ?? "—"}
            </dd>
          </div>

          <div>
            <dt>Created</dt>
            <dd className="text-ink">
              {new Date(
                complaint.createdAt,
              ).toLocaleString()}
            </dd>
          </div>

          <div>
            <dt>SLA deadline</dt>
            <dd className="text-ink">
              {new Date(
                complaint.createdAt.getTime() +
                  overdueHours * 3600 * 1000,
              ).toLocaleString()}
            </dd>
          </div>
        </dl>
      </div>

      <div className="space-y-6">
        {user.role === "ADMIN" && (
          <>
            <div className="panel rounded-2xl p-6">
              <h2 className="display text-2xl">
                Update priority
              </h2>

              <PriorityForm
                complaintId={complaint.id}
                currentPriority={complaint.priority}
              />
            </div>

            <div className="panel rounded-2xl p-6">
              <h2 className="display text-2xl">
                Update status
              </h2>

              <StatusForm
                complaintId={complaint.id}
                currentStatus={complaint.status}
                assignedToId={complaint.assignedToId}
                staff={staff}
              />
            </div>
          </>
        )}

        <div className="panel rounded-2xl p-6">
          <h2 className="display text-2xl">
            History
          </h2>

          <p className="mb-4 text-sm text-muted">
            Every status change with actor, time, and note.
          </p>

          <StatusTimeline
            history={complaint.history.map((event) => ({
              id: event.id,
              fromStatus: event.fromStatus,
              toStatus: event.toStatus,
              note: event.note,
              createdAt: event.createdAt.toISOString(),
              actor: {
                id: event.actor.id,
                name: event.actor.name,
                role: event.actor.role,
              },
            }))}
          />
        </div>
      </div>
    </div>
  );
}