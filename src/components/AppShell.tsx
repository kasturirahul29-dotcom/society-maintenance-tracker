"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/client";
import type { SessionUser } from "@/lib/types";

export function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const admin = user.role === "ADMIN";

  const links = [
    { href: "/dashboard", label: "Home" },
    { href: "/complaints", label: "Complaints" },
    { href: "/notices", label: "Notice board" },
    ...(admin
      ? [
          { href: "/admin", label: "Dashboard" },
          { href: "/admin/notices", label: "Notices" },
          { href: "/admin/settings", label: "Settings" },
        ]
      : []),
  ];

  async function logout() {
    try {
      await api("/api/auth/logout", {
        method: "POST",
      });
    } catch {
      // The session may already be expired.
      // Either way, continue to the login page.
    }

    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link
            href="/dashboard"
            className="display text-xl tracking-tight"
          >
            Atrium
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => {
              const active =
                pathname === link.href ||
                pathname.startsWith(`${link.href}/`);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-3 py-1.5 text-sm ${
                    active
                      ? "bg-moss text-white"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3 text-sm">
            <div className="hidden text-right sm:block">
              <div className="font-medium">{user.name}</div>

              <div className="text-xs text-muted">
                {user.role === "ADMIN"
                  ? "Admin"
                  : user.unitNumber ?? "Resident"}
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="rounded-full border border-line px-3 py-1.5 text-sm hover:bg-white"
            >
              Sign out
            </button>
          </div>
        </div>

        <nav className="flex gap-2 overflow-x-auto px-4 pb-3 md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`shrink-0 rounded-full px-3 py-1 text-sm ${
                pathname.startsWith(link.href)
                  ? "bg-moss text-white"
                  : "bg-white text-muted"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}