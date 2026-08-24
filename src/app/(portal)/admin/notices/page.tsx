"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/client";
import type { NoticeDto } from "@/lib/types";

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<NoticeDto[]>([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");

  async function load() {
    const data = await api<NoticeDto[]>("/api/admin/notices");
    setNotices(data);
  }

  useEffect(() => {
    load().catch(() => setError("Could not load notices"));
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      await api("/api/admin/notices", {
        method: "POST",
        body: JSON.stringify({
          title: data.get("title"),
          body: data.get("body"),
          isPinned: data.get("isPinned") === "on",
          isImportant: data.get("isImportant") === "on",
        }),
      });

      form.reset();
      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not publish notice",
      );
    } finally {
      setPending(false);
    }
  }

  function startEdit(notice: NoticeDto) {
    setEditingId(notice.id);
    setEditTitle(notice.title);
    setEditBody(notice.body);
    setError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle("");
    setEditBody("");
  }

  async function saveEdit(id: string) {
    if (!editTitle.trim() || !editBody.trim()) {
      setError("Title and body are required");
      return;
    }

    setPending(true);
    setError("");

    try {
      await api(`/api/admin/notices/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: editTitle.trim(),
          body: editBody.trim(),
        }),
      });

      cancelEdit();
      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not update notice",
      );
    } finally {
      setPending(false);
    }
  }

  async function toggle(
    notice: NoticeDto,
    field: "isPinned" | "isImportant",
  ) {
    try {
      await api(`/api/admin/notices/${notice.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          [field]: !notice[field],
        }),
      });

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not update notice",
      );
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this notice?")) {
      return;
    }

    try {
      await api(`/api/admin/notices/${id}`, {
        method: "DELETE",
      });

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not delete notice",
      );
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div>
        <h1 className="display text-4xl">Notice board</h1>

        <form
          onSubmit={onSubmit}
          className="panel mt-5 space-y-3 rounded-2xl p-5"
        >
          {error && (
            <p className="text-sm text-clay">
              {error}
            </p>
          )}

          <input
            required
            name="title"
            placeholder="Title"
            className="w-full rounded-xl border border-line bg-white px-3 py-2"
          />

          <textarea
            required
            name="body"
            rows={6}
            placeholder="Body"
            className="w-full rounded-xl border border-line bg-white px-3 py-2"
          />

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isPinned" />
            Pin to top
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isImportant" />
            Mark important (emails residents)
          </label>

          <button
            disabled={pending}
            className="rounded-full bg-moss px-4 py-2 text-white"
          >
            {pending ? "Publishing..." : "Publish"}
          </button>
        </form>
      </div>

      <div className="space-y-3">
        {notices.map((notice) => (
          <article
            key={notice.id}
            className="panel rounded-2xl p-5"
          >
            <div className="flex flex-wrap gap-2">
              {notice.isPinned && (
                <span className="badge bg-moss/15 text-moss">
                  Pinned
                </span>
              )}

              {notice.isImportant && (
                <span className="badge bg-clay/15 text-clay">
                  Important
                </span>
              )}
            </div>

            {editingId === notice.id ? (
              <div className="mt-3 space-y-3">
                <input
                  value={editTitle}
                  onChange={(e) =>
                    setEditTitle(e.target.value)
                  }
                  className="w-full rounded-xl border border-line bg-white px-3 py-2"
                  placeholder="Notice title"
                />

                <textarea
                  value={editBody}
                  onChange={(e) =>
                    setEditBody(e.target.value)
                  }
                  rows={6}
                  className="w-full rounded-xl border border-line bg-white px-3 py-2"
                  placeholder="Notice body"
                />

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => saveEdit(notice.id)}
                    className="rounded-full bg-moss px-3 py-1 text-sm text-white"
                  >
                    {pending ? "Saving..." : "Save changes"}
                  </button>

                  <button
                    type="button"
                    disabled={pending}
                    onClick={cancelEdit}
                    className="rounded-full border border-line px-3 py-1 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="mt-2 font-semibold">
                  {notice.title}
                </h2>

                <p className="text-sm text-muted">
                  {notice.body}
                </p>

                <div className="mt-3 flex flex-wrap gap-2 text-sm">
                  <button
                    type="button"
                    className="rounded-full border border-line px-3 py-1"
                    onClick={() => startEdit(notice)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="rounded-full border border-line px-3 py-1"
                    onClick={() =>
                      toggle(notice, "isPinned")
                    }
                  >
                    {notice.isPinned ? "Unpin" : "Pin"}
                  </button>

                  <button
                    type="button"
                    className="rounded-full border border-line px-3 py-1"
                    onClick={() =>
                      toggle(notice, "isImportant")
                    }
                  >
                    {notice.isImportant
                      ? "Unmark"
                      : "Important"}
                  </button>

                  <button
                    type="button"
                    className="rounded-full border border-line px-3 py-1 text-clay"
                    onClick={() => remove(notice.id)}
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}