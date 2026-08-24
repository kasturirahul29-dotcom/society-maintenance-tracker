import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export default async function NoticesPage() {
  await requireUser();
  const notices = await prisma.notice.findMany({
    where: { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
    include: { createdBy: true },
    orderBy: [{ isPinned: "desc" }, { isImportant: "desc" }, { publishedAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display text-4xl">Notice board</h1>
        <p className="text-muted">Pinned and important notices stay at the top.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {notices.map((notice) => (
          <article key={notice.id} className="panel rounded-2xl p-5">
            <div className="flex flex-wrap gap-2">
              {notice.isPinned && <span className="badge bg-moss/15 text-moss">Pinned</span>}
              {notice.isImportant && <span className="badge bg-clay/15 text-clay">Important</span>}
            </div>
            <h2 className="display mt-2 text-2xl">{notice.title}</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm">{notice.body}</p>
            <p className="mt-4 text-xs text-muted">
              {notice.createdBy.name} · {new Date(notice.publishedAt).toLocaleString()}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
