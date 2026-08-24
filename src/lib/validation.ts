import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72)
    .regex(/[A-Za-z]/, "Password must include a letter")
    .regex(/[0-9]/, "Password must include a number"),
  unitNumber: z.string().trim().min(1).max(20).optional(),
  phone: z.string().trim().min(7).max(20).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1),
});

export const complaintCreateSchema = z.object({
  categoryId: z.string().min(1),
  description: z.string().trim().min(10).max(4000),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
});

export const complaintStatusSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED"]),
  note: z.string().trim().max(1000).optional(),
  assignedToId: z.string().min(1).nullable().optional(),
});

export const complaintQuerySchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  categoryId: z.string().optional(),
  overdue: z.enum(["true", "false"]).optional(),
  search: z.string().optional(),

  // Date filtering
  fromDate: z.string().optional(),
  toDate: z.string().optional(),

  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(60),
  description: z.string().trim().max(240).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const noticeSchema = z.object({
  title: z.string().trim().min(3).max(140),
  body: z.string().trim().min(10).max(8000),
  isPinned: z.boolean().optional(),
  isImportant: z.boolean().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

export const settingsSchema = z.object({
  overdueThresholdHours: z.number().int().min(1).max(24 * 30),
});