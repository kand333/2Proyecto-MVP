import { NextResponse, type NextRequest } from "next/server";
import { toErrorResponse } from "@/lib/http/api-error";
import { getOrderByToken } from "@/services/order-view-service";

/** An order by its secret token (RF-09, DEC-007): whoever has the link sees it; nothing else does. */
export async function GET(_request: NextRequest, context: RouteContext<"/api/orders/[token]">) {
  try {
    const { token } = await context.params;
    return NextResponse.json(await getOrderByToken(token), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return toErrorResponse(error);
  }
}
