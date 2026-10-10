import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/authorization";
import { toErrorResponse } from "@/lib/http/api-error";
import { listAccountOrders } from "@/services/account-order-service";

/** The session user's orders (RF-16). */
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    return NextResponse.json(await listAccountOrders(user.id), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return toErrorResponse(error);
  }
}
