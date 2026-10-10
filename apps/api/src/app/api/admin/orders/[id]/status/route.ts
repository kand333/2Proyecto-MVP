import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/authorization";
import { errorResponse, toErrorResponse } from "@/lib/http/api-error";
import { changeOrderStatus } from "@/services/order-admin-service";
import { ORDER_NOT_FOUND } from "@/services/order-view-service";
import { orderIdSchema, orderStatusChangeSchema } from "@portal/shared/order";


/** Applies a valid status change (RF-15): 409 for an invalid one, 400 to ship without tracking. ADMIN only. */
export async function PATCH(request: NextRequest, context: RouteContext<"/api/admin/orders/[id]/status">) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    if (!orderIdSchema.safeParse(id).success) return errorResponse(404, ORDER_NOT_FOUND);
    const body: unknown = await request.json().catch(() => undefined);
    if (body === undefined) return errorResponse(400, "El cuerpo de la solicitud debe ser JSON válido");
    const parsed = orderStatusChangeSchema.safeParse(body);
    if (!parsed.success) return errorResponse(400, parsed.error.issues[0]?.message ?? "Cambio de estado inválido");
    return NextResponse.json(await changeOrderStatus(id, parsed.data));
  } catch (error) {
    return toErrorResponse(error);
  }
}
