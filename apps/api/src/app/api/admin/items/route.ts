import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/authorization";
import { errorResponse, toErrorResponse } from "@/lib/http/api-error";
import { createItem, listItems } from "@/services/item-service";
import { itemCreateSchema, itemListQuerySchema } from "@portal/shared/item";

/** Every item (published or not), newest first, with search over the title. ADMIN only. */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const parsed = itemListQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
    if (!parsed.success) return errorResponse(400, parsed.error.issues[0]?.message ?? "Parámetros de consulta inválidos");
    return NextResponse.json(await listItems(parsed.data), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** Creates an item. ADMIN only. */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body: unknown = await request.json().catch(() => undefined);
    if (body === undefined) return errorResponse(400, "El cuerpo de la solicitud debe ser JSON válido");
    const parsed = itemCreateSchema.safeParse(body);
    if (!parsed.success) return errorResponse(400, parsed.error.issues[0]?.message ?? "Datos del item inválidos");
    return NextResponse.json(await createItem(parsed.data), { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
