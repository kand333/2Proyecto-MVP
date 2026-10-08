import { NextResponse, type NextRequest } from "next/server";
import { errorResponse, toErrorResponse } from "@/lib/http/api-error";
import { listPublishedItems } from "@/services/public-item-service";
import { itemListQuerySchema } from "@portal/shared/item";

// Public Item layer. Removable as a whole (see CLAUDE.md).

/** Published items, newest first, with search over the title. Public. */
export async function GET(request: NextRequest) {
  try {
    const parsed = itemListQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
    if (!parsed.success) return errorResponse(400, parsed.error.issues[0]?.message ?? "Parámetros de consulta inválidos");
    return NextResponse.json(await listPublishedItems(parsed.data));
  } catch (error) {
    return toErrorResponse(error);
  }
}
