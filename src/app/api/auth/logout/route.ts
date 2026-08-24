import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/lib/auth";
import { ok, withRoute } from "@/lib/api";

export const POST = withRoute(async () => {
  const jar = await cookies();
  jar.set(AUTH_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return ok({ success: true });
});
