import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE, verifyToken } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/register"];
const PUBLIC_API = ["/api/auth/login", "/api/auth/register", "/api/health"];

function isPublic(pathname: string) {
  if (pathname === "/") return true;
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true;
  }
  if (PUBLIC_API.some((p) => pathname === p)) return true;
  if (pathname.startsWith("/uploads/")) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname === "/favicon.ico") return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  let role: string | null = null;

  if (token) {
    try {
      role = (await verifyToken(token)).role;
    } catch {
      role = null;
    }
  }

  if (pathname.startsWith("/api/")) {
    if (isPublic(pathname)) return NextResponse.next();
    if (!role) {
      return NextResponse.json(
        { error: { message: "Authentication required", details: null } },
        { status: 401 },
      );
    }
    if (pathname.startsWith("/api/admin") && role !== "ADMIN") {
      return NextResponse.json(
        { error: { message: "Admin access required", details: null } },
        { status: 403 },
      );
    }
    return NextResponse.next();
  }

  if (isPublic(pathname)) {
    if (role && (pathname === "/login" || pathname === "/register")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (!role) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
