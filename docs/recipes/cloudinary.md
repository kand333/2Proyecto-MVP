# Receta: imágenes con Cloudinary

La API sube las imágenes a Cloudinary con firma (Upload API). La BD guarda solo `url` y `publicId`, nunca binarios. `next/image` pide a Cloudinary cada tamaño, así el servidor de Next nunca descarga originales.
Código probado en producción en el proyecto de origen; aquí aplicado a `Item`.

## 1. Dependencias

Ninguna: `fetch`, `FormData` y `node:crypto`.

## 2. Variables de entorno (`apps/api/.env.example` y `.env.local`; secretas, solo servidor)

```text
# Cloudinary - imágenes (SECRETO). Claves: https://console.cloudinary.com/settings/api-keys
# La API key debe poder crear y eliminar assets.
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Agrégalas también a `requiredVariableNames` y `secretVariableNames` de `apps/api/tests/env-example.test.ts`, y a `backendVariableNames` de `apps/web/tests/env-example.test.ts`.

## 3. Modelo (Prisma) y migración

```prisma
model ItemImage {
  id        String   @id @default(uuid(7)) @db.Uuid
  itemId    String   @db.Uuid
  url       String
  // Cloudinary public_id: required to delete the remote asset.
  publicId  String   @unique
  position  Int
  createdAt DateTime @default(now())

  item Item @relation(fields: [itemId], references: [id], onDelete: Cascade)

  @@index([itemId, position])
}
// y en Item: images ItemImage[]
```

Luego `npm run db:migrate -w @portal/api -- --name item_images`.

Ojo: `onDelete: Cascade` borra las filas, no los assets remotos. Para borrar un item con imágenes, destruye primero sus assets en Cloudinary.

## 4. Cliente Cloudinary (`apps/api/src/lib/cloudinary.ts`)

```ts
import "server-only";
import { createHash } from "node:crypto";
import { ApiError } from "@/lib/http/api-error";

export const IMAGES_FOLDER = "<app-slug>-items";
/** At most 2560 px on the longest side, never upscaled; delivery sizes are made per request. */
export const UPLOAD_TRANSFORMATION = "c_limit,w_2560,h_2560";

function readConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !apiSecret) {
    console.error("Cloudinary is not configured");
    throw new ApiError(503, "La subida de imágenes no está disponible");
  }
  return { cloudName, apiKey, apiSecret };
}

/** Params sorted by name as `key=value&…` + secret, SHA-1 hex. `file`, `api_key`, `resource_type`, `cloud_name` are never signed. */
export function signCloudinaryParams(params: Record<string, string>, apiSecret: string): string {
  const toSign = Object.keys(params).sort().map((key) => `${key}=${params[key]}`).join("&");
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
    if (response.status === 401 || response.status === 403) throw new ApiError(503, "La subida de imágenes no está disponible: revisa la configuración de Cloudinary.");
    throw new ApiError(502, "No fue posible guardar la imagen. Inténtalo de nuevo.");
  }
  return result as Record<string, unknown>;
}

export async function uploadImage(file: Blob): Promise<{ url: string; publicId: string }> {
  const result = await callUploadApi("upload", { folder: IMAGES_FOLDER, transformation: UPLOAD_TRANSFORMATION }, file);
  if (typeof result.secure_url !== "string" || typeof result.public_id !== "string") throw new ApiError(502, "Respuesta inesperada de Cloudinary");
  return { url: result.secure_url, publicId: result.public_id };
}

export async function destroyImage(publicId: string): Promise<void> {
  await callUploadApi("destroy", { public_id: publicId, invalidate: "true" });
}
```

## 5. Validación compartida (`packages/shared/src/item-image.ts`)

```ts
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_FIELD = "file";

/** Type by the first bytes (magic number), never by name or MIME: a renamed PDF is rejected. */
export function detectImageType(bytes: Uint8Array): (typeof IMAGE_TYPES)[number] | null {
  const startsWith = (signature: number[], offset = 0) => signature.every((byte, index) => bytes[offset + index] === byte);
  if (startsWith([0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (startsWith([0x52, 0x49, 0x46, 0x46]) && startsWith([0x57, 0x45, 0x42, 0x50], 8)) return "image/webp";
  return null;
}
```

## 6. Servicio y ruta

- Servicio `addItemImage(itemId, file)`:
  1. Valida en orden: `file.size === 0` → 400; `> MAX_IMAGE_BYTES` → 413; `detectImageType(primeros 16 bytes)` nulo → 415.
  2. Comprueba que el item existe **antes** de subir.
  3. Sube con `uploadImage(new Blob([await file.arrayBuffer()], { type }))`.
  4. Inserta la fila. Si falla la inserción, `destroyImage(publicId)` para no dejar huérfanos.
- Borrar una imagen: primero `destroyImage` y luego la fila. Si Cloudinary falla, no cambia nada y se puede reintentar.
- Ruta `POST /api/admin/items/[id]/images`:
  - `requireAdmin` + `itemIdSchema`;
  - rechaza `content-length > MAX_IMAGE_BYTES + 64 KB` con 413 antes de leer;
  - lee `await request.formData()`, campo `IMAGE_FIELD` (`instanceof Blob`) → 201.
- Web: `postForm` de `apps/web/src/lib/api-client.ts` (ya existe) con un `FormData`.

## 7. Entrega optimizada en la web

`apps/web/src/lib/image-loader.ts`:

```ts
"use client";

type ImageLoaderParams = { src: string; width: number; quality?: number };
const UPLOAD_SEGMENT = "/image/upload/";

/** Each CDN resizes at the width next/image asks for; anything else is served as is. */
export default function imageLoader({ src, width }: ImageLoaderParams): string {
  if (!src.startsWith("https://res.cloudinary.com/") || !src.includes(UPLOAD_SEGMENT)) return src;
  return src.replace(UPLOAD_SEGMENT, `${UPLOAD_SEGMENT}f_auto,q_auto,c_limit,w_${width}/`);
}
```

`apps/web/next.config.ts`, en `nextConfig`:

```ts
images: {
  loader: "custom",
  loaderFile: "./src/lib/image-loader.ts",
  remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" }],
},
```

## 8. Validación

- Unit: `signCloudinaryParams` no depende del orden; `detectImageType` (JPEG/PNG/WebP sí, PDF no); `image-loader` inserta `f_auto,q_auto,c_limit,w_N`.
- Integración: `uploadImage` con `vi.stubGlobal("fetch", ...)` y una respuesta simulada. Comprueba que la firma va en el body y que un 401 de Cloudinary se traduce en 503.
- Manual: sube una imagen en el admin, verifica que aparece en la carpeta de Cloudinary y bórrala.

## 9. Reversión

Elimina `lib/cloudinary.ts`, `item-image.ts`, la ruta, el servicio, `image-loader.ts` y el bloque `images` de `next.config.ts`. Después:

1. Crea una migración que borre `ItemImage`.
2. Quita las variables de `.env.example` y de los tests de env.
3. Borra los assets de la carpeta en Cloudinary.
