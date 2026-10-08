import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/authorization";
import { toErrorResponse } from "@/lib/http/api-error";
import { getDashboardStats } from "@/services/admin-service";

/** Indicators of the administration dashboard. ADMIN only. */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    return NextResponse.json(await getDashboardStats(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return toErrorResponse(error);
  }
}
