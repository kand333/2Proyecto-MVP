import { NextResponse } from "next/server";
import { errorResponse, toErrorResponse } from "@/lib/http/api-error";
import { RATE_LIMITS, rateLimit } from "@/lib/http/rate-limit";
import { subscribe } from "@/services/subscriber-service";
import { subscribeSchema, type SubscribeResponse } from "@portal/shared/subscriber";

/** Subscribes an email with marketing consent and returns its welcome code (201 new, 200 already subscribed). Public. */
export async function POST(request: Request) {
  const limited = rateLimit(request, RATE_LIMITS.subscribe);
  if (limited) return limited;
  const body: unknown = await request.json().catch(() => undefined);
  if (body === undefined) return errorResponse(400, "El cuerpo de la solicitud debe ser JSON válido");

  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) return errorResponse(400, parsed.error.issues[0]?.message ?? "Datos de suscripción inválidos");

  try {
    const { code, created } = await subscribe(parsed.data.email);
    return NextResponse.json({ code } satisfies SubscribeResponse, { status: created ? 201 : 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
