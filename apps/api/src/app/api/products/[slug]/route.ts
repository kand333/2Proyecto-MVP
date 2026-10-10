import { NextResponse, type NextRequest } from "next/server";
import { errorResponse, toErrorResponse } from "@/lib/http/api-error";
import { PRODUCT_NOT_FOUND } from "@/services/product-service";
import { getVisibleProduct } from "@/services/public-product-service";
import { productSlugSchema } from "@portal/shared/product";

/** A visible product with its active variants. Public. */
export async function GET(_request: NextRequest, context: RouteContext<"/api/products/[slug]">) {
  try {
    const { slug } = await context.params;
    if (!productSlugSchema.safeParse(slug).success) return errorResponse(404, PRODUCT_NOT_FOUND);
    return NextResponse.json(await getVisibleProduct(slug));
  } catch (error) {
    return toErrorResponse(error);
  }
}
