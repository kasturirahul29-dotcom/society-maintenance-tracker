import { requireUser } from "@/lib/auth";
import { ok, withRoute } from "@/lib/api";

export const GET = withRoute(async () => {
  const user = await requireUser();
  return ok(user);
});
