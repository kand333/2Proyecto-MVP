import { NextResponse, type NextRequest } from "next/server";
import { getOptionalUser } from "@/lib/auth/authorization";
import { errorResponse, toErrorResponse } from "@/lib/http/api-error";
import { RATE_LIMITS, rateLimit } from "@/lib/http/rate-limit";
import { createOrder } from "@/services/order-service";
import { orderCreateSchema, type OrderCreated } from "@portal/shared/order";

/** Places an order as a guest or with a session (RF-08). Answers the order number and its secret token. */
export async function POST(request: NextRequest) {
  const limited = rateLimit(request, RATE_LIMITS.order);
  if (limited) return limited;
  const body: unknown = await request.json().catch(() => undefined);
  if (body === undefined) return errorResponse(400, "El cuerpo de la solicitud debe ser JSON válido");

  const parsed = orderCreateSchema.safeParse(body);
  if (!parsed.success) return errorResponse(400, parsed.error.issues[0]?.message ?? "Datos del pedido inválidos");

  try {
    const user = await getOptionalUser(request);
    const created: OrderCreated = await createOrder(parsed.data, user);
    return NextResponse.json(created, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return toErrorResponse(error);
  }
}
