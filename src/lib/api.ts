import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { ApiError } from "@/lib/errors";

export type JsonValue = Record<string, unknown> | unknown[];

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function fail(status: number, message: string, details?: unknown) {
  return NextResponse.json(
    { error: { message, details: details ?? null } },
    { status },
  );
}

export async function parseJson<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ApiError(400, "Request body must be valid JSON");
  }
  return schema.parse(body);
}

export function handleError(error: unknown) {
  if (error instanceof ApiError) {
    return fail(error.status, error.message, error.details);
  }
  if (error instanceof ZodError) {
    return fail(400, "Validation failed", error.flatten());
  }
  console.error(error);
  return fail(500, "An unexpected error occurred");
}

export function withHandler(
  handler: (request: Request, context: { params: Promise<Record<string, string>> }) => Promise<Response>,
) {
  return async (request: Request, context: { params: Promise<Record<string, string>> }) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleError(error);
    }
  };
}

export function withRoute(handler: (request: Request) => Promise<Response>) {
  return async (request: Request) => {
    try {
      return await handler(request);
    } catch (error) {
      return handleError(error);
    }
  };
}
