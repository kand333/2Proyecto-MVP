import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/authorization";
import { errorResponse, toErrorResponse } from "@/lib/http/api-error";
import { archiveProduct, changeProduct, getProduct } from "@/services/product-service";
import { productIdSchema, productUpdateSchema } from "@portal/shared/product";

type ProductContext = RouteContext<"/api/admin/products/[id]">;

const INVALID_ID = "Identificador de producto inválido";

/** One product with all its variants, archived or not. ADMIN only. */
export async function GET(request: NextRequest, context: ProductContext) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    if (!productIdSchema.safeParse(id).success) return errorResponse(400, INVALID_ID);
    return NextResponse.json(await getProduct(id), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** Changes any field; `variants` replaces the list by SKU (missing ones are deactivated). ADMIN only. */
export async function PATCH(request: NextRequest, context: ProductContext) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    if (!productIdSchema.safeParse(id).success) return errorResponse(400, INVALID_ID);
    const body: unknown = await request.json().catch(() => undefined);
    if (body === undefined) return errorResponse(400, "El cuerpo de la solicitud debe ser JSON válido");
    const parsed = productUpdateSchema.safeParse(body);
    if (!parsed.success) return errorResponse(400, parsed.error.issues[0]?.message ?? "Cambio inválido");
    return NextResponse.json(await changeProduct(id, parsed.data));
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** Archives the product (never deletes it: orders point at its variants). ADMIN only. */
export async function DELETE(request: NextRequest, context: ProductContext) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    if (!productIdSchema.safeParse(id).success) return errorResponse(400, INVALID_ID);
    await archiveProduct(id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
