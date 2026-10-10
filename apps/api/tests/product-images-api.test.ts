import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { NextRequest } from "next/server";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { ProductImage } from "@portal/shared/product-image";

// Integration test: product photos (RF-21, DEC-012) against the test database, with Cloudinary simulated by a fetch stub.
loadEnvConfig(process.cwd());
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());
const hasAuthSecret = (process.env.AUTH_SECRET?.trim().length ?? 0) >= 32;

const testRunId = randomUUID().slice(0, 8);
const origin = "http://localhost:3100/api";
const missingId = "00000000-0000-4000-8000-000000000000";

const JPEG: Uint8Array<ArrayBuffer> = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, ...Array(60).fill(1)]);
const PDF: Uint8Array<ArrayBuffer> = new Uint8Array([0x25, 0x50, 0x44, 0x46, ...Array(60).fill(1)]);

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

async function sessionCookieFor(role: "USER" | "ADMIN") {
  const prisma = await getPrisma();
  const user = await prisma.user.create({
    data: { name: role, email: `${role.toLowerCase()}-images-${testRunId}@example.com`, passwordHash: "scrypt$not-used-here", role },
  });
  const { createSessionToken } = await import("@/lib/auth/session-token");
  return `terpenex_session=${createSessionToken(user.id)}`;
}

async function upload(productId: string, bytes: Uint8Array<ArrayBuffer> | null, cookie?: string) {
  const { POST } = await import("@/app/api/admin/products/[id]/images/route");
  const form = new FormData();
  if (bytes) form.set("file", new Blob([bytes]), "foto.jpg");
  const response = await POST(
    new NextRequest(`${origin}/admin/products/${productId}/images`, { method: "POST", body: form, headers: cookie ? { cookie } : {} }),
    { params: Promise.resolve({ id: productId }) },
  );
  return { status: response.status, body: response.status === 204 ? null : await response.json() };
}

async function remove(productId: string, imageId: string, cookie?: string) {
  const { DELETE } = await import("@/app/api/admin/products/[id]/images/[imageId]/route");
  const response = await DELETE(
    new NextRequest(`${origin}/admin/products/${productId}/images/${imageId}`, { method: "DELETE", headers: cookie ? { cookie } : {} }),
    { params: Promise.resolve({ id: productId, imageId }) },
  );
  return { status: response.status, body: response.status === 204 ? null : await response.json() };
}

/** Cloudinary simulated: every upload returns a new asset; destroy answers ok. Records the calls. */
const cloudinaryCalls: { action: string; body: FormData }[] = [];
let uploadCount = 0;
function stubCloudinary(status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: { body: FormData }) => {
      const action = url.endsWith("/destroy") ? "destroy" : "upload";
      cloudinaryCalls.push({ action, body: init.body });
      if (status !== 200) return Response.json({ error: { message: "denied" } }, { status });
      uploadCount += 1;
      const publicId = `terpenex/${testRunId}-${uploadCount}`;
      return Response.json(action === "upload" ? { secure_url: `https://res.cloudinary.com/demo/image/upload/v1/${publicId}.jpg`, public_id: publicId } : { result: "ok" });
    }),
  );
}

describe.skipIf(!hasDatabaseUrl || !hasAuthSecret)("product images API", () => {
  let adminCookie: string;
  let userCookie: string;
  let productId: string;

  beforeAll(async () => {
    adminCookie = await sessionCookieFor("ADMIN");
    userCookie = await sessionCookieFor("USER");
    const prisma = await getPrisma();
    productId = (
      await prisma.product.create({
        data: {
          slug: `fotos-${testRunId}`,
          name: `Fotos ${testRunId}`,
          description: "",
          category: "TERPENES",
          isPublished: true,
          variants: { create: { name: "1 ml", sku: `F-${testRunId}`.toUpperCase(), priceClp: 990, stock: 1, position: 0 } },
        },
      })
    ).id;
  });

  beforeEach(() => {
    vi.stubEnv("CLOUDINARY_CLOUD_NAME", "demo");
    vi.stubEnv("CLOUDINARY_API_KEY", "key");
    vi.stubEnv("CLOUDINARY_API_SECRET", "secret");
    cloudinaryCalls.length = 0;
    stubCloudinary();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  afterAll(async () => {
    const prisma = await getPrisma();
    await prisma.product.deleteMany({ where: { slug: { contains: testRunId } } });
    await prisma.user.deleteMany({ where: { email: { contains: testRunId } } });
    await prisma.$disconnect();
  });

  it("answers 401 without a session and 403 to a USER, without calling Cloudinary", async () => {
    expect((await upload(productId, JPEG)).status).toBe(401);
    expect((await upload(productId, JPEG, userCookie)).status).toBe(403);
    expect((await remove(productId, missingId, userCookie)).status).toBe(403);
    expect(cloudinaryCalls).toHaveLength(0);
  });

  it("uploads a signed JPEG, appends it in order and shows it as the cover", async () => {
    const first = await upload(productId, JPEG, adminCookie);
    expect(first.status).toBe(201);
    expect(first.body).toMatchObject({ position: 0, url: expect.stringContaining("https://res.cloudinary.com/") });
    const second = await upload(productId, JPEG, adminCookie);
    expect((second.body as ProductImage).position).toBe(1);

    const call = cloudinaryCalls[0];
    expect(call?.body.get("folder")).toBe("terpenex");
    expect(call?.body.get("api_key")).toBe("key");
    expect(String(call?.body.get("signature"))).toMatch(/^[0-9a-f]{40}$/);

    const { GET } = await import("@/app/api/products/route");
    const catalog = await (await GET(new NextRequest(`${origin}/products?search=${testRunId}`))).json();
    expect(catalog.data[0].coverUrl).toBe((first.body as ProductImage).url);
  });

  it("validates the file: missing 400, not an image 415, too big 413, missing product 404", async () => {
    expect((await upload(productId, null, adminCookie)).status).toBe(400);
    expect(await upload(productId, PDF, adminCookie)).toEqual({ status: 415, body: { message: "Sube una imagen JPG, PNG o WebP", status: 415 } });
    const big = new Uint8Array(5 * 1024 * 1024 + 1);
    big.set([0xff, 0xd8, 0xff]);
    expect((await upload(productId, big, adminCookie)).status).toBe(413);
    expect((await upload(missingId, JPEG, adminCookie)).status).toBe(404);
    expect(cloudinaryCalls).toHaveLength(0);
  });

  it("answers 409 over 8 photos", async () => {
    const prisma = await getPrisma();
    const current = await prisma.productImage.count({ where: { productId } });
    for (let index = current; index < 8; index += 1) expect((await upload(productId, JPEG, adminCookie)).status).toBe(201);
    expect(await upload(productId, JPEG, adminCookie)).toEqual({ status: 409, body: { message: "Un producto admite hasta 8 fotos", status: 409 } });
  });

  it("deletes in Cloudinary before the database, and keeps the row if Cloudinary fails", async () => {
    const prisma = await getPrisma();
    const image = await prisma.productImage.findFirstOrThrow({ where: { productId }, orderBy: { position: "desc" } });

    stubCloudinary(500);
    expect((await remove(productId, image.id, adminCookie)).status).toBe(502);
    expect(await prisma.productImage.count({ where: { id: image.id } })).toBe(1);

    stubCloudinary();
    expect((await remove(productId, image.id, adminCookie)).status).toBe(204);
    expect(cloudinaryCalls.at(-1)?.body.get("public_id")).toBe(image.publicId);
    expect(await prisma.productImage.count({ where: { id: image.id } })).toBe(0);
    expect((await remove(productId, image.id, adminCookie)).status).toBe(404);
  });

  it("answers 503 without Cloudinary keys and when Cloudinary rejects them", async () => {
    vi.stubEnv("CLOUDINARY_API_SECRET", "");
    expect(await upload(productId, JPEG, adminCookie)).toMatchObject({ status: 503 });
    vi.stubEnv("CLOUDINARY_API_SECRET", "secret");
    const prisma = await getPrisma();
    await prisma.productImage.deleteMany({ where: { productId } });
    stubCloudinary(401);
    expect((await upload(productId, JPEG, adminCookie)).status).toBe(503);
  });

  it("answers 415 when Cloudinary cannot read a file that looks like an image", async () => {
    stubCloudinary(400);
    expect(await upload(productId, JPEG, adminCookie)).toEqual({ status: 415, body: { message: "La imagen está dañada o no se puede leer", status: 415 } });
  });
});

describe("signCloudinaryParams", () => {
  it("signs the params sorted by name, whatever their order", async () => {
    const { signCloudinaryParams } = await import("@/lib/cloudinary");
    const signature = signCloudinaryParams({ timestamp: "1", folder: "a" }, "secret");
    expect(signature).toBe(signCloudinaryParams({ folder: "a", timestamp: "1" }, "secret"));
    expect(signature).toMatch(/^[0-9a-f]{40}$/);
  });
});
