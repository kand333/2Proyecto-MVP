import type { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/authorization";
import { errorResponse, toErrorResponse } from "@/lib/http/api-error";
import { IMAGE_NOT_FOUND, removeProductImage } from "@/services/product-image-service";
import { productIdSchema } from "@portal/shared/product";

/** Deletes a photo, first in Cloudinary and then in the database (RF-21). ADMIN only. */
export async function DELETE(request: NextRequest, context: RouteContext<"/api/admin/products/[id]/images/[imageId]">) {
  try {
    await requireAdmin(request);
    const { id, imageId } = await context.params;
    if (!productIdSchema.safeParse(id).success || !productIdSchema.safeParse(imageId).success) return errorResponse(404, IMAGE_NOT_FOUND);
    await removeProductImage(id, imageId);
    return new Response(null, { status: 204 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
