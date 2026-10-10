import { NextResponse } from "next/server";
import { errorResponse, toErrorResponse } from "@/lib/http/api-error";
import { RATE_LIMITS, rateLimit } from "@/lib/http/rate-limit";
import { buildQuote } from "@/services/checkout-service";
import { quoteSchema } from "@portal/shared/order";

/** Prices, stock, shipping and discount of a cart, computed by the server (RF-07). Public. */
export async function POST(request: Request) {
  const limited = rateLimit(request, RATE_LIMITS.quote);
  if (limited) return limited;
  const body: unknown = await request.json().catch(() => undefined);
  if (body === undefined) return errorResponse(400, "El cuerpo de la solicitud debe ser JSON válido");

  const parsed = quoteSchema.safeParse(body);
  if (!parsed.success) return errorResponse(400, parsed.error.issues[0]?.message ?? "Carrito inválido");

  try {
    return NextResponse.json(await buildQuote(parsed.data), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return toErrorResponse(error);
  }
}
