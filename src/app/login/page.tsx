"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { api } from "@/lib/client";

type LoginResponse = {
  id: string;
  email: string;
  name: string;
  role: "RESIDENT" | "ADMIN";
  unitNumber: string | null;
  phone: string | null;
};

type LoginMode = "RESIDENT" | "ADMIN";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();

  const [mode, setMode] = useState<LoginMode>("RESIDENT");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    const form = new FormData(event.currentTarget);

    try {
      const user = await api<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      });

      // Make sure the selected login type matches
      // the actual role stored in the database.
      if (mode === "ADMIN" && user.role !== "ADMIN") {
        throw new Error(
          "This account is not an administration account.",
        );
      }

      if (mode === "RESIDENT" && user.role !== "RESIDENT") {
        throw new Error(
          "This account is not a resident account.",
        );
      }

      const next = params.get("next");

      if (next) {
        router.push(next);
      } else if (user.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to sign in",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <Link href="/" className="display text-2xl">
        Atrium
      </Link>

      <h1 className="display mt-6 text-4xl">Welcome back</h1>

      <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-line bg-white p-1">
        <button
          type="button"
          onClick={() => {
            setMode("RESIDENT");
            setError("");
          }}
          className={`rounded-xl px-4 py-2.5 text-sm ${
            mode === "RESIDENT"
              ? "bg-moss text-white"
              : "text-muted"
          }`}
        >
          Resident
        </button>

        <button
          type="button"
          onClick={() => {
            setMode("ADMIN");
            setError("");
          }}
          className={`rounded-xl px-4 py-2.5 text-sm ${
            mode === "ADMIN"
              ? "bg-moss text-white"
              : "text-muted"
          }`}
        >
          Administration
        </button>
      </div>

      <form
        onSubmit={onSubmit}
        className="panel mt-4 space-y-4 rounded-2xl p-6"
      >
        {error && (
          <p className="rounded-lg bg-clay/10 px-3 py-2 text-sm text-clay">
            {error}
          </p>
        )}

        <div className="text-sm text-muted">
          Signing in as{" "}
          <span className="font-medium text-ink">
            {mode === "ADMIN" ? "Administration" : "Resident"}
          </span>
        </div>

        <label className="block text-sm">
          Email
          <input
            required
            name="email"
            type="email"
            className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2"
            defaultValue={
              mode === "ADMIN"
                ? "admin@atrium.local"
                : "resident@atrium.local"
            }
          />
        </label>

        <label className="block text-sm">
          Password
          <input
            required
            name="password"
            type="password"
            className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2"
            defaultValue={
              mode === "ADMIN"
                ? "Admin@123"
                : "Resident@123"
            }
          />
        </label>

        <button
          disabled={pending}
          className="w-full rounded-full bg-moss py-2.5 text-white disabled:opacity-60"
        >
          {pending
            ? "Signing in..."
            : mode === "ADMIN"
              ? "Sign in as Administration"
              : "Sign in as Resident"}
        </button>

        {mode === "RESIDENT" && (
          <p className="text-center text-sm text-muted">
            New resident?{" "}
            <Link href="/register" className="text-moss">
              Create an account
            </Link>
          </p>
        )}
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}