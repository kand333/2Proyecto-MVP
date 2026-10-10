import type { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/authorization";
import { toErrorResponse } from "@/lib/http/api-error";
import { exportSubscribersCsv } from "@/services/subscriber-service";

/** CSV download of the subscribers (RF-20): personal data, so never cached. ADMIN only. */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    return new Response(await exportSubscribersCsv(), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="subscribers.csv"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
