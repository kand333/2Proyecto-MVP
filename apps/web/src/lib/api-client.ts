/** Error thrown by the browser API client; carries the REST status and message. */
export class ApiClientError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

async function readJsonResponse<Data>(response: Response, fallbackMessage: string): Promise<Data> {
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message =
      body && typeof body === "object" && "message" in body && typeof body.message === "string"
        ? body.message
        : fallbackMessage;
    throw new ApiClientError(response.status, message);
  }
  // 204 No Content has no body.
  if (response.status === 204) return undefined as Data;
  return response.json() as Promise<Data>;
}

/** GETs a JSON resource from the REST API and throws ApiClientError on non-2xx responses. */
export async function fetchJson<Data>(url: string): Promise<Data> {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  return readJsonResponse<Data>(response, "No fue posible cargar la información");
}

/** Sends a request (with an optional JSON body) to the REST API and throws ApiClientError on non-2xx responses. */
export async function sendJson<Data>(
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  url: string,
  body?: unknown,
): Promise<Data> {
  const response = await fetch(url, {
    method,
    headers: { Accept: "application/json", ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return readJsonResponse<Data>(response, "No fue posible enviar la información");
}

/** POSTs a JSON body to the REST API and throws ApiClientError on non-2xx responses. */
export function postJson<Data>(url: string, body: unknown): Promise<Data> {
  return sendJson<Data>("POST", url, body);
}

/** POSTs a multipart form (e.g. a file upload) to the REST API and throws ApiClientError on non-2xx responses. */
export async function postForm<Data>(url: string, body: FormData): Promise<Data> {
  // No Content-Type header: the browser sets it with the multipart boundary.
  const response = await fetch(url, { method: "POST", headers: { Accept: "application/json" }, body });
  return readJsonResponse<Data>(response, "No fue posible enviar el archivo");
}
