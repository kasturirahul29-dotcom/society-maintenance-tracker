export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function notFound(message = "Resource not found") {
  return new ApiError(404, message);
}

export function unauthorized(message = "Authentication required") {
  return new ApiError(401, message);
}

export function forbidden(message = "You do not have permission to do that") {
  return new ApiError(403, message);
}

export function badRequest(message: string, details?: unknown) {
  return new ApiError(400, message, details);
}

export function conflict(message: string) {
  return new ApiError(409, message);
}
