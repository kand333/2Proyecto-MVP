import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/http/api-error";
import { getPublicSettings } from "@/services/settings-service";

/** Shipping cost, free delivery threshold and pickup address, for the cart and checkout. Public. */
export async function GET() {
  try {
    return NextResponse.json(await getPublicSettings(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return toErrorResponse(error);
  }
}
