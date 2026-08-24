import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { badRequest } from "@/lib/errors";

const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

const MAX_BYTES = 5 * 1024 * 1024;

export async function saveComplaintPhoto(file: File | null) {
  if (!file || file.size === 0) return null;
  if (file.size > MAX_BYTES) {
    throw badRequest("Photo must be 5MB or smaller");
  }
  const ext = ALLOWED.get(file.type);
  if (!ext) {
    throw badRequest("Photo must be a JPEG, PNG, or WebP image");
  }

  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const filename = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);
  return `/uploads/${filename}`;
}
