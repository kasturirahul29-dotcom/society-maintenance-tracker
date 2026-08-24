"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/client";
import type { CategoryDto } from "@/lib/types";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [error, setError] = useState("");

  async function load() {
    setCategories(await api<CategoryDto[]>("/api/admin/categories"));
  }

  useEffect(() => {
    load().catch(() => setError("Could not load categories"));
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      await api("/api/admin/categories", {
        method: "POST",
        body: JSON.stringify({
          name: data.get("name"),
          description: data.get("description") || undefined,
        }),
      });
      form.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create category");
    }
  }

  async function toggle(category: CategoryDto) {
    await api(`/api/admin/categories/${category.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        name: category.name,
        isActive: !category.isActive,
      }),
    });
    await load();
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="display text-4xl">Categories</h1>
      <form onSubmit={onSubmit} className="panel space-y-3 rounded-2xl p-5">
        {error && <p className="text-sm text-clay">{error}</p>}
        <input required name="name" placeholder="Name" className="w-full rounded-xl border border-line bg-white px-3 py-2" />
        <input name="description" placeholder="Description" className="w-full rounded-xl border border-line bg-white px-3 py-2" />
        <button className="rounded-full bg-moss px-4 py-2 text-white">Add category</button>
      </form>
      <div className="space-y-2">
        {categories.map((category) => (
          <div key={category.id} className="panel flex items-center justify-between rounded-2xl px-4 py-3">
            <div>
              <div className="font-medium">{category.name}</div>
              <div className="text-sm text-muted">
                {category.description ?? "No description"} · {category._count?.complaints ?? 0} tickets
              </div>
            </div>
            <button onClick={() => toggle(category)} className="rounded-full border border-line px-3 py-1 text-sm">
              {category.isActive ? "Disable" : "Enable"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
