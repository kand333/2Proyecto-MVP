import { NextResponse, type NextRequest } from "next/server";
import { errorResponse, toErrorResponse } from "@/lib/http/api-error";
import { listVisibleProducts } from "@/services/public-product-service";
import { productListQuerySchema } from "@portal/shared/product";

/** Public catalog: visible products, newest first, with search, category and featured filters. */
export async function GET(request: NextRequest) {
  try {
    const parsed = productListQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
    if (!parsed.success) return errorResponse(400, parsed.error.issues[0]?.message ?? "Parámetros de consulta inválidos");
    return NextResponse.json(await listVisibleProducts(parsed.data));
  } catch (error) {
    return toErrorResponse(error);
  }
}
