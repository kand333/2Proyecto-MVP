import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/authorization";
import { errorResponse, toErrorResponse } from "@/lib/http/api-error";
import { getAdminOrder } from "@/services/order-admin-service";
import { ORDER_NOT_FOUND } from "@/services/order-view-service";
import { orderIdSchema } from "@portal/shared/order";


/** One order with its items, buyer and delivery data. ADMIN only. */
export async function GET(request: NextRequest, context: RouteContext<"/api/admin/orders/[id]">) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    if (!orderIdSchema.safeParse(id).success) return errorResponse(404, ORDER_NOT_FOUND);
    return NextResponse.json(await getAdminOrder(id), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return toErrorResponse(error);
  }
}
