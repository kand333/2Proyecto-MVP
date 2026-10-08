import { describe, expect, it, vi } from "vitest";
import { ApiError, errorResponse, toErrorResponse } from "./api-error";

describe("errorResponse", () => {
  it("returns the documented error body with the same status", async () => {
    const response = errorResponse(404, "Recurso no encontrado");
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ message: "Recurso no encontrado", status: 404 });
  });
});

describe("toErrorResponse", () => {
  it("exposes the message of an ApiError", async () => {
    const response = toErrorResponse(new ApiError(409, "Conflicto"));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ message: "Conflicto", status: 409 });
  });

  it("hides internal details of unexpected errors", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = toErrorResponse(new Error("connection string with password"));

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({ message: "Error interno del servidor", status: 500 });
    expect(JSON.stringify(body)).not.toContain("password");
    consoleError.mockRestore();
  });
});
