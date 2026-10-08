import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Item } from "@portal/shared/item";
import type { PaginatedResponse } from "@portal/shared/pagination";

// Integration test of the public Item layer (removable as a whole, see CLAUDE.md).
loadEnvConfig(process.cwd());
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());

const testRunId = randomUUID().slice(0, 8);
const origin = "http://localhost:3000/api";

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

const read = async (response: Response) => ({ status: response.status, body: await response.json() });

async function list(query: string) {
  const { GET } = await import("@/app/api/items/route");
  return read(await GET(new NextRequest(`${origin}/items${query}`)));
}

async function get(id: string) {
  const { GET } = await import("@/app/api/items/[id]/route");
  return read(await GET(new NextRequest(`${origin}/items/${id}`), { params: Promise.resolve({ id }) }));
}

describe.skipIf(!hasDatabaseUrl)("public items API", () => {
  let publishedId: string;
  let draftId: string;

  beforeAll(async () => {
    const prisma = await getPrisma();
    publishedId = (await prisma.item.create({ data: { title: `Published ${testRunId}`, description: "", isPublished: true } })).id;
    draftId = (await prisma.item.create({ data: { title: `Draft ${testRunId}`, description: "" } })).id;
  });

  afterAll(async () => {
    const prisma = await getPrisma();
    await prisma.item.deleteMany({ where: { title: { contains: testRunId } } });
    await prisma.$disconnect();
  });

  it("lists only published items", async () => {
    const { status, body } = await list(`?search=${testRunId}`);
    expect(status).toBe(200);
    expect((body as PaginatedResponse<Item>).data.map((item) => item.id)).toEqual([publishedId]);
  });

  it("shows a published item and hides a draft behind the same 404", async () => {
    expect((await get(publishedId)).body).toMatchObject({ id: publishedId, isPublished: true });
    expect(await get(draftId)).toEqual({ status: 404, body: { message: "Item no encontrado", status: 404 } });
    expect((await get("not-a-uuid")).status).toBe(400);
  });
});
