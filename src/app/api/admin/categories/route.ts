import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { conflict } from "@/lib/errors";
import { ok, parseJson, withRoute } from "@/lib/api";
import { categorySchema } from "@/lib/validation";

export const GET = withRoute(async () => {
  await requireAdmin();
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { complaints: true } } },
  });
  return ok(categories);
});

export const POST = withRoute(async (request) => {
  await requireAdmin();
  const body = await parseJson(request, categorySchema);
  const exists = await prisma.category.findUnique({ where: { name: body.name } });
  if (exists) throw conflict("A category with this name already exists");
  const category = await prisma.category.create({ data: body });
  return ok(category, 201);
});
