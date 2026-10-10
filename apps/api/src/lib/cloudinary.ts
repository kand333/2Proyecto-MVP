import "server-only";
import { createHash } from "node:crypto";
import { APP_SLUG } from "@portal/shared/app-config";
import { ApiError } from "@/lib/http/api-error";

// Signed Upload API with fetch (docs/recipes/cloudinary.md, DEC-012): no SDK, no new dependency.

// Folder of the Cloudinary media library where every product photo goes.
export const IMAGES_FOLDER = APP_SLUG;
/** At most 2560 px on the longest side, never upscaled; delivery sizes are made per request. */
export const UPLOAD_TRANSFORMATION = "c_limit,w_2560,h_2560";
export const UPLOADS_UNAVAILABLE = "La subida de imágenes no está disponible";

function readConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !apiSecret) {
    console.error("Cloudinary is not configured");
    throw new ApiError(503, UPLOADS_UNAVAILABLE);
  }
  return { cloudName, apiKey, apiSecret };
}

/** Params sorted by name as `key=value&…` + secret, SHA-1 hex. `file`, `api_key`, `resource_type`, `cloud_name` are never signed. */
export function signCloudinaryParams(params: Record<string, string>, apiSecret: string): string {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(toSign + apiSecret).digest("hex");
}

async function callUploadApi(action: "upload" | "destroy", params: Record<string, string>, file?: Blob) {
  const { cloudName, apiKey, apiSecret } = readConfig();
  const signed = { ...params, timestamp: String(Math.floor(Date.now() / 1000)) };
  const body = new FormData();
  if (file) body.set("file", file);
  for (const [key, value] of Object.entries(signed)) body.set(key, value);
  body.set("api_key", apiKey);
  body.set("signature", signCloudinaryParams(signed, apiSecret));

  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/${action}`, { method: "POST", body });
  const result: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    console.error(`Cloudinary ${action} failed (HTTP ${response.status})`, result); // never returned to the client
    if (response.status === 401 || response.status === 403) {
      throw new ApiError(503, `${UPLOADS_UNAVAILABLE}: revisa la configuración de Cloudinary.`);
    }
    // The file starts like an image but Cloudinary cannot read it (cut or corrupt).
    if (action === "upload" && response.status === 400) throw new ApiError(415, "La imagen está dañada o no se puede leer");
    throw new ApiError(502, "No fue posible guardar la imagen. Inténtalo de nuevo.");
  }
  return (result ?? {}) as Record<string, unknown>;
}

export async function uploadImage(file: Blob): Promise<{ url: string; publicId: string }> {
  const result = await callUploadApi("upload", { folder: IMAGES_FOLDER, transformation: UPLOAD_TRANSFORMATION }, file);
  if (typeof result.secure_url !== "string" || typeof result.public_id !== "string") throw new ApiError(502, "Respuesta inesperada de Cloudinary");
  return { url: result.secure_url, publicId: result.public_id };
}

export async function destroyImage(publicId: string): Promise<void> {
  await callUploadApi("destroy", { public_id: publicId, invalidate: "true" });
}
