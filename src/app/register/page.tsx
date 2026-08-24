"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { api } from "@/lib/client";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          password: form.get("password"),
          unitNumber: form.get("unitNumber") || undefined,
          phone: form.get("phone") || undefined,
        }),
      });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to register");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <Link href="/" className="display text-2xl">
        Atrium
      </Link>
      <h1 className="display mt-6 text-4xl">Join your society</h1>
      <form onSubmit={onSubmit} className="panel mt-6 space-y-4 rounded-2xl p-6">
        {error && <p className="rounded-lg bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}
        <label className="block text-sm">
          Full name
          <input required name="name" className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2" />
        </label>
        <label className="block text-sm">
          Email
          <input required name="email" type="email" className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2" />
        </label>
        <label className="block text-sm">
          Password
          <input required name="password" type="password" minLength={8} className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            Unit
            <input name="unitNumber" placeholder="B-204" className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2" />
          </label>
          <label className="block text-sm">
            Phone
            <input name="phone" className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2" />
          </label>
        </div>
        <button disabled={pending} className="w-full rounded-full bg-moss py-2.5 text-white disabled:opacity-60">
          {pending ? "Creating account…" : "Create resident account"}
        </button>
        <p className="text-center text-sm text-muted">
          Already registered?{" "}
          <Link href="/login" className="text-moss">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
