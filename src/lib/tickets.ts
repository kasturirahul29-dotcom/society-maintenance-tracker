import { prisma } from "@/lib/prisma";

export async function nextTicketNo() {
  const count = await prisma.complaint.count();
  return `SMT-${String(count + 1).padStart(5, "0")}`;
}
