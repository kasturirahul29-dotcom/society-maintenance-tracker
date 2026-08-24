import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
      <p className="text-sm tracking-[0.2em] text-moss uppercase">Society operations</p>
      <h1 className="display mt-3 max-w-3xl text-5xl leading-tight text-moss-deep sm:text-6xl">
        Maintenance that the building can actually see.
      </h1>
      <p className="mt-5 max-w-xl text-lg text-muted">
        Residents file complaints with photos and priority. Admins track status history, overdue
        SLAs, and the notice board — without a spreadsheet trail.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/login" className="rounded-full bg-moss px-5 py-2.5 text-white">
          Sign in
        </Link>
        <Link href="/register" className="rounded-full border border-line px-5 py-2.5">
          Register as resident
        </Link>
      </div>
    </div>
  );
}
