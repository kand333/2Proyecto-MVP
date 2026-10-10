import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/authorization";
import { errorResponse, toErrorResponse } from "@/lib/http/api-error";
import { getAccountOrder } from "@/services/account-order-service";
import { ORDER_NOT_FOUND } from "@/services/order-view-service";
import { orderIdSchema } from "@portal/shared/order";

/** One order of the session user (RF-16); another user's order answers 404. */
export async function GET(request: NextRequest, context: RouteContext<"/api/account/orders/[id]">) {
  try {
    const user = await requireUser(request);
    const { id } = await context.params;
    if (!orderIdSchema.safeParse(id).success) return errorResponse(404, ORDER_NOT_FOUND);
    return NextResponse.json(await getAccountOrder(user.id, id), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return toErrorResponse(error);
  }
}
