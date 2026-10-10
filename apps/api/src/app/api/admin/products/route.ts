import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/authorization";
import { errorResponse, toErrorResponse } from "@/lib/http/api-error";
import { createProduct, listProducts } from "@/services/product-service";
import { adminProductListQuerySchema, productCreateSchema } from "@portal/shared/product";

/** Products with their variants, newest first, with search, category, featured and status filters. ADMIN only. */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const parsed = adminProductListQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
    if (!parsed.success) return errorResponse(400, parsed.error.issues[0]?.message ?? "Parámetros de consulta inválidos");
    return NextResponse.json(await listProducts(parsed.data), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** Creates a product with its variants. ADMIN only. */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body: unknown = await request.json().catch(() => undefined);
    if (body === undefined) return errorResponse(400, "El cuerpo de la solicitud debe ser JSON válido");
    const parsed = productCreateSchema.safeParse(body);
    if (!parsed.success) return errorResponse(400, parsed.error.issues[0]?.message ?? "Datos del producto inválidos");
    return NextResponse.json(await createProduct(parsed.data), { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
