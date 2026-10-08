/** Error with an HTTP status and a message that is safe to show to API clients. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type ApiErrorBody = {
  message: string;
  status: number;
};

export function errorResponse(status: number, message: string): Response {
  return Response.json({ message, status } satisfies ApiErrorBody, { status });
}

/** Converts any thrown value into a REST error response without leaking internals. */
export function toErrorResponse(error: unknown): Response {
  if (error instanceof ApiError) {
    return errorResponse(error.status, error.message);
  }
  console.error(error);
  return errorResponse(500, "Error interno del servidor");
}
