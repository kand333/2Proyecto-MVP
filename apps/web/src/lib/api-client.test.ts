import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiClientError, fetchJson, postJson, sendJson } from "./api-client";

afterEach(() => vi.unstubAllGlobals());

describe("fetchJson", () => {
  it("returns the parsed body of successful responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ data: [1] })));
    await expect(fetchJson("/api/items")).resolves.toEqual({ data: [1] });
  });

  it("throws ApiClientError with the REST message on errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ message: "Recurso no encontrado", status: 404 }, { status: 404 })),
    );
    await expect(fetchJson("/api/items/x")).rejects.toMatchObject({
      name: "ApiClientError",
      status: 404,
      message: "Recurso no encontrado",
    });
  });

  it("uses a generic message when the error body is not JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("Bad gateway", { status: 502 })));
    const error = await fetchJson("/api/items").catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiClientError);
    expect(error).toMatchObject({ status: 502, message: "No fue posible cargar la información" });
  });
});

describe("postJson", () => {
  it("sends the body as JSON and returns the parsed response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ id: "1" }, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(postJson("/api/items", { name: "Ana" })).resolves.toEqual({ id: "1" });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/items",
      expect.objectContaining({ method: "POST", body: '{"name":"Ana"}' }),
    );
    expect(fetchMock.mock.calls[0][1].headers).toMatchObject({ "Content-Type": "application/json" });
  });

  it("throws ApiClientError with the REST message on errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ message: "Ingresa tu nombre", status: 400 }, { status: 400 })),
    );
    await expect(postJson("/api/items", {})).rejects.toMatchObject({ status: 400, message: "Ingresa tu nombre" });
  });
});

describe("sendJson", () => {
  it("uses the given method and returns undefined for 204 No Content", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(sendJson("PUT", "/api/account/password", { newPassword: "x" })).resolves.toBeUndefined();
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "PUT", body: '{"newPassword":"x"}' });
  });
});
