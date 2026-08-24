import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

function transporter() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });
}

export async function sendMail(options: {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
}) {
  const transport = transporter();
  const to = Array.isArray(options.to) ? options.to.join(", ") : options.to;
  if (!transport) {
    console.info(`[mail:skipped] ${options.subject} -> ${to}`);
    return { skipped: true as const };
  }

  await transport.sendMail({
    from: process.env.SMTP_FROM ?? "Atrium <noreply@society.local>",
    to,
    subject: options.subject,
    text: options.text,
    html: options.html ?? `<pre>${options.text}</pre>`,
  });
  return { skipped: false as const };
}

export async function notifyAdmins(subject: string, text: string) {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { email: true },
  });
  if (!admins.length) return;
  await sendMail({ to: admins.map((a) => a.email), subject, text });
}

export async function notifyUser(userId: string, subject: string, text: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!user) return;
  await sendMail({ to: user.email, subject, text });
}

export async function notifyAllResidents(subject: string, text: string) {
  const residents = await prisma.user.findMany({
    where: { role: "RESIDENT" },
    select: { email: true },
  });
  if (!residents.length) return;
  await sendMail({ to: residents.map((r) => r.email), subject, text });
}
