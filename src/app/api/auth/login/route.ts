import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  AUTH_COOKIE,
  cookieOptions,
  signToken,
  verifyPassword,
} from "@/lib/auth";
import { unauthorized } from "@/lib/errors";
import { ok, parseJson, withRoute } from "@/lib/api";
import { loginSchema } from "@/lib/validation";

export const POST = withRoute(async (request) => {
  const body = await parseJson(request, loginSchema);
  const user = await prisma.user.findUnique({ where: { email: body.email } });
  if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
    throw unauthorized("Invalid email or password");
  }

  const token = await signToken({ sub: user.id, role: user.role, email: user.email });
  const jar = await cookies();
  jar.set(AUTH_COOKIE, token, cookieOptions());

  return ok({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    unitNumber: user.unitNumber,
    phone: user.phone,
  });
});
