import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getOverdueThresholdHours, isOverdue } from "@/lib/settings";
import { PriorityBadge, StatusBadge } from "@/components/Badges";

export default async function DashboardPage() {
  const user = await requireUser();
  const overdueHours = await getOverdueThresholdHours();

  const [complaints, notices] = await Promise.all([
    prisma.complaint.findMany({
      where: user.role === "ADMIN" ? undefined : { createdById: user.id },
      include: { category: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.notice.findMany({
      where: { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      orderBy: [{ isPinned: "desc" }, { isImportant: "desc" }, { publishedAt: "desc" }],
      take: 4,
    }),
  ]);

  const mine = user.role === "ADMIN" ? complaints : complaints;
  const openCount = await prisma.complaint.count({
    where: {
      status: { not: "RESOLVED" },
      ...(user.role === "ADMIN" ? {} : { createdById: user.id }),
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-moss">Good to see you</p>
          <h1 className="display text-4xl">{user.name.split(" ")[0]}</h1>
        </div>
        <Link href="/complaints/new" className="rounded-full bg-clay px-5 py-2.5 text-white">
          File a complaint
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <Stat label="Open tickets" value={String(openCount)} />
        <Stat label="SLA window" value={`${overdueHours}h`} />
        <Stat label="Notices" value={String(notices.length)} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="panel rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="display text-2xl">Recent complaints</h2>
            <Link href="/complaints" className="text-sm text-moss">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {mine.length === 0 && <p className="text-sm text-muted">No complaints yet.</p>}
            {mine.map((item) => (
              <Link
                key={item.id}
                href={`/complaints/${item.id}`}
                className="block rounded-xl border border-line bg-white px-4 py-3 hover:border-moss"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{item.ticketNo}</span>
                  <div className="flex gap-2">
                    {isOverdue(item.createdAt, item.status, overdueHours) && (
                      <span className="badge bg-clay/15 text-clay">Overdue</span>
                    )}
                    <PriorityBadge priority={item.priority} />
                    <StatusBadge status={item.status} />
                  </div>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {item.category.name} · {item.description.slice(0, 90)}
                  {item.description.length > 90 ? "…" : ""}
                </p>
              </Link>
            ))}
          </div>
        </div>

        <div className="panel rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="display text-2xl">Notice board</h2>
            <Link href="/notices" className="text-sm text-moss">
              Board
            </Link>
          </div>
          <div className="space-y-4">
            {notices.map((notice) => (
              <article key={notice.id}>
                <div className="flex gap-2">
                  {notice.isPinned && <span className="badge bg-moss/15 text-moss">Pinned</span>}
                  {notice.isImportant && <span className="badge bg-clay/15 text-clay">Important</span>}
                </div>
                <h3 className="mt-1 font-semibold">{notice.title}</h3>
                <p className="text-sm text-muted">{notice.body.slice(0, 110)}…</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel rounded-2xl p-5">
      <div className="text-sm text-muted">{label}</div>
      <div className="display text-3xl">{value}</div>
    </div>
  );
}
