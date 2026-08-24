"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Category } from "@prisma/client";

export function ComplaintFilters({
  categories,
}: {
  categories: Pick<Category, "id" | "name">[];
}) {
  const router = useRouter();
  const params = useSearchParams();

  function update(name: string, value: string) {
    const next = new URLSearchParams(params.toString());

    if (value) {
      next.set(name, value);
    } else {
      next.delete(name);
    }

    router.push(`/complaints?${next.toString()}`);
  }

  const selectClass =
    "rounded-full border border-line bg-white px-3 py-2 text-sm";

  const inputClass =
    "rounded-full border border-line bg-white px-3 py-2 text-sm";

  return (
    <form
      className="flex flex-wrap gap-2"
      onSubmit={(e) => e.preventDefault()}
    >
      <input
        defaultValue={params.get("search") ?? ""}
        placeholder="Search ticket or description"
        className="min-w-48 flex-1 rounded-full border border-line bg-white px-4 py-2 text-sm"
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            update("search", event.currentTarget.value);
          }
        }}
      />

      <select
        className={selectClass}
        defaultValue={params.get("status") ?? ""}
        onChange={(e) => update("status", e.target.value)}
      >
        <option value="">All statuses</option>
        <option value="OPEN">Open</option>
        <option value="IN_PROGRESS">In progress</option>
        <option value="RESOLVED">Resolved</option>
      </select>

      <select
        className={selectClass}
        defaultValue={params.get("priority") ?? ""}
        onChange={(e) => update("priority", e.target.value)}
      >
        <option value="">All priorities</option>
        <option value="LOW">Low</option>
        <option value="MEDIUM">Medium</option>
        <option value="HIGH">High</option>
      </select>

      <select
        className={selectClass}
        defaultValue={params.get("categoryId") ?? ""}
        onChange={(e) => update("categoryId", e.target.value)}
      >
        <option value="">All categories</option>

        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>

      <select
        className={selectClass}
        defaultValue={params.get("overdue") ?? ""}
        onChange={(e) => update("overdue", e.target.value)}
      >
        <option value="">SLA</option>
        <option value="true">Overdue</option>
        <option value="false">On time</option>
      </select>

      <input
        type="date"
        aria-label="From date"
        title="From date"
        value={params.get("fromDate") ?? ""}
        className={inputClass}
        onChange={(e) => update("fromDate", e.target.value)}
      />

      <input
        type="date"
        aria-label="To date"
        title="To date"
        value={params.get("toDate") ?? ""}
        className={inputClass}
        onChange={(e) => update("toDate", e.target.value)}
      />
    </form>
  );
}