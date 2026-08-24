import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { notFound } from "@/lib/errors";
import { ok, parseJson, withHandler } from "@/lib/api";
import { noticeSchema } from "@/lib/validation";

export const PATCH = withHandler(async (request, context) => {
  await requireAdmin();
  const { id } = await context.params;
  const body = await parseJson(request, noticeSchema.partial());
  const existing = await prisma.notice.findUnique({ where: { id } });
  if (!existing) throw notFound("Notice not found");
  const notice = await prisma.notice.update({
    where: { id },
    data: {
      ...body,
      expiresAt: body.expiresAt === undefined ? undefined : body.expiresAt ? new Date(body.expiresAt) : null,
    },
    include: { createdBy: { select: { id: true, name: true } } },
  });
  return ok(notice);
});

export const DELETE = withHandler(async (_request, context) => {
  await requireAdmin();
  const { id } = await context.params;
  const existing = await prisma.notice.findUnique({ where: { id } });
  if (!existing) throw notFound("Notice not found");
  await prisma.notice.delete({ where: { id } });
  return ok({ success: true });
});
