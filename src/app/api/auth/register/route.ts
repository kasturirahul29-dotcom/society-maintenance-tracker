import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE, cookieOptions, hashPassword, signToken } from "@/lib/auth";
import { conflict } from "@/lib/errors";
import { ok, parseJson, withRoute } from "@/lib/api";
import { registerSchema } from "@/lib/validation";

export const POST = withRoute(async (request) => {
  const body = await parseJson(request, registerSchema);
  const exists = await prisma.user.findUnique({ where: { email: body.email } });
  if (exists) throw conflict("An account with this email already exists");

  const user = await prisma.user.create({
    data: {
      email: body.email,
      name: body.name,
      passwordHash: await hashPassword(body.password),
      unitNumber: body.unitNumber,
      phone: body.phone,
      role: "RESIDENT",
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      unitNumber: true,
      phone: true,
    },
  });

  const token = await signToken({ sub: user.id, role: user.role, email: user.email });
  const jar = await cookies();
  jar.set(AUTH_COOKIE, token, cookieOptions());
  return ok(user, 201);
});
