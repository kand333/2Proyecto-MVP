import { NextResponse, type NextRequest } from "next/server";
import { errorResponse, toErrorResponse } from "@/lib/http/api-error";
import { getPublishedItem } from "@/services/public-item-service";
import { itemIdSchema } from "@portal/shared/item";

// Public Item layer. Removable as a whole (see CLAUDE.md).

/** A published item; 404 when it does not exist or is not published. Public. */
export async function GET(_request: NextRequest, context: RouteContext<"/api/items/[id]">) {
  try {
    const { id } = await context.params;
    if (!itemIdSchema.safeParse(id).success) return errorResponse(400, "Identificador de item inválido");
    return NextResponse.json(await getPublishedItem(id));
  } catch (error) {
    return toErrorResponse(error);
  }
}
