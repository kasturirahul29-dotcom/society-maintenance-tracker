import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { ok, parseJson, withRoute } from "@/lib/api";
import { noticeSchema } from "@/lib/validation";
import { notifyAllResidents } from "@/lib/mail";

export const GET = withRoute(async () => {
  await requireAdmin();

  const notices = await prisma.notice.findMany({
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [
      { isPinned: "desc" },
      { publishedAt: "desc" },
    ],
  });

  return ok(notices);
});

export const POST = withRoute(async (request) => {
  const admin = await requireAdmin();
  const body = await parseJson(request, noticeSchema);

  const notice = await prisma.notice.create({
    data: {
      title: body.title,
      body: body.body,
      isPinned: body.isPinned ?? false,
      isImportant: body.isImportant ?? false,
      expiresAt: body.expiresAt
        ? new Date(body.expiresAt)
        : null,
      createdById: admin.id,
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (notice.isImportant) {
    await notifyAllResidents(
      `Important notice: ${notice.title}`,
      `${notice.body}\n\nPosted by ${admin.name}`,
    );
  }

  return ok(notice, 201);
});