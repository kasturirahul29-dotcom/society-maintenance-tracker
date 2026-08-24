import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { notFound } from "@/lib/errors";
import { ok, parseJson, withHandler } from "@/lib/api";
import { categorySchema } from "@/lib/validation";

export const PATCH = withHandler(async (request, context) => {
  await requireAdmin();
  const { id } = await context.params;
  const body = await parseJson(request, categorySchema.partial());
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw notFound("Category not found");
  const category = await prisma.category.update({ where: { id }, data: body });
  return ok(category);
});
