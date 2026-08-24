import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { ok, withRoute } from "@/lib/api";

export const GET = withRoute(async () => {
  await requireUser();
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return ok(categories);
});
