import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/authorization";
import { errorResponse, toErrorResponse } from "@/lib/http/api-error";
import { addProductImage } from "@/services/product-image-service";
import { productIdSchema } from "@portal/shared/product";
import { IMAGE_FIELD, MAX_IMAGE_BYTES } from "@portal/shared/product-image";

/** Room for the multipart boundaries and headers around the file. */
const MULTIPART_OVERHEAD_BYTES = 64 * 1024;

/** Uploads one photo of the product to Cloudinary (RF-21). ADMIN only. */
export async function POST(request: NextRequest, context: RouteContext<"/api/admin/products/[id]/images">) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    if (!productIdSchema.safeParse(id).success) return errorResponse(400, "Identificador de producto inválido");
    // Rejected before reading the body: a huge upload never reaches memory.
    if (Number(request.headers.get("content-length") ?? 0) > MAX_IMAGE_BYTES + MULTIPART_OVERHEAD_BYTES) {
      return errorResponse(413, "La imagen supera los 5 MB");
    }
    const form = await request.formData().catch(() => null);
    const file = form?.get(IMAGE_FIELD);
    if (!(file instanceof Blob)) return errorResponse(400, "Elige una imagen");
    return NextResponse.json(await addProductImage(id, file), { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
