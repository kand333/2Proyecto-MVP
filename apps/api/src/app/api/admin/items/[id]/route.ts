import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/authorization";
import { errorResponse, toErrorResponse } from "@/lib/http/api-error";
import { changeItem, getItem, removeItem } from "@/services/item-service";
import { itemIdSchema, itemUpdateSchema } from "@portal/shared/item";

type ItemContext = RouteContext<"/api/admin/items/[id]">;

const INVALID_ID = "Identificador de item inválido";

/** One item, published or not. ADMIN only. */
export async function GET(request: NextRequest, context: ItemContext) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    if (!itemIdSchema.safeParse(id).success) return errorResponse(400, INVALID_ID);
    return NextResponse.json(await getItem(id), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** Changes any of the item's fields. ADMIN only. */
export async function PATCH(request: NextRequest, context: ItemContext) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    if (!itemIdSchema.safeParse(id).success) return errorResponse(400, INVALID_ID);
    const body: unknown = await request.json().catch(() => undefined);
    if (body === undefined) return errorResponse(400, "El cuerpo de la solicitud debe ser JSON válido");
    const parsed = itemUpdateSchema.safeParse(body);
    if (!parsed.success) return errorResponse(400, parsed.error.issues[0]?.message ?? "Cambio inválido");
    return NextResponse.json(await changeItem(id, parsed.data));
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** Deletes an item for good. ADMIN only. */
export async function DELETE(request: NextRequest, context: ItemContext) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    if (!itemIdSchema.safeParse(id).success) return errorResponse(400, INVALID_ID);
    await removeItem(id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
