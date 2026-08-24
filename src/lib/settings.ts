import { prisma } from "@/lib/prisma";

export const OVERDUE_SETTING_KEY = "overdueThresholdHours";

export async function getOverdueThresholdHours() {
  const row = await prisma.appSetting.findUnique({
    where: { key: OVERDUE_SETTING_KEY },
  });
  if (row) {
    const parsed = Number(row.value);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  const fallback = Number(process.env.DEFAULT_OVERDUE_HOURS ?? 48);
  return Number.isFinite(fallback) && fallback > 0 ? fallback : 48;
}

export async function setOverdueThresholdHours(hours: number) {
  return prisma.appSetting.upsert({
    where: { key: OVERDUE_SETTING_KEY },
    update: { value: String(hours) },
    create: { key: OVERDUE_SETTING_KEY, value: String(hours) },
  });
}

export function isOverdue(createdAt: Date, status: string, hours: number) {
  if (status === "RESOLVED") return false;
  return Date.now() - createdAt.getTime() > hours * 60 * 60 * 1000;
}

export function overdueSince(createdAt: Date, hours: number) {
  return new Date(createdAt.getTime() + hours * 60 * 60 * 1000);
}
