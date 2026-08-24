"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/client";
import type { CategoryDto } from "@/lib/types";

export default function NewComplaintPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    api<CategoryDto[]>("/api/categories").then(setCategories).catch(() => setError("Could not load categories"));
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const created = await api<{ id: string }>("/api/complaints", { method: "POST", body: form });
      router.push(`/complaints/${created.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create complaint");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="display text-4xl">File a complaint</h1>
      <p className="mt-1 text-muted">Add a category, description, optional photo, and priority.</p>
      <form onSubmit={onSubmit} className="panel mt-6 space-y-4 rounded-2xl p-6">
        {error && <p className="rounded-lg bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}
        <label className="block text-sm">
          Category
          <select required name="categoryId" className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2">
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Priority
          <select name="priority" defaultValue="MEDIUM" className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2">
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </label>
        <label className="block text-sm">
          Description
          <textarea
            required
            name="description"
            minLength={10}
            rows={6}
            className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2"
            placeholder="What happened, where, and since when?"
          />
        </label>
        <label className="block text-sm">
          Photo (optional)
          <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" className="mt-1 w-full text-sm" />
        </label>
        <button disabled={pending} className="rounded-full bg-moss px-5 py-2.5 text-white disabled:opacity-60">
          {pending ? "Submitting…" : "Submit complaint"}
        </button>
      </form>
    </div>
  );
}
