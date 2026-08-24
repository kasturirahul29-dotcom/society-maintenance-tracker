import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { ok, withRoute } from "@/lib/api";

export const GET = withRoute(async () => {
  await requireUser();
  const now = new Date();
  const notices = await prisma.notice.findMany({
    where: {
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    include: { createdBy: { select: { id: true, name: true } } },
    orderBy: [{ isPinned: "desc" }, { isImportant: "desc" }, { publishedAt: "desc" }],
  });
  return ok(notices);
});
