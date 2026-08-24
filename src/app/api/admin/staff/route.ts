import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { ok, withRoute } from "@/lib/api";

export const GET = withRoute(async () => {
  await requireAdmin();
  const users = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
  return ok(users);
});
