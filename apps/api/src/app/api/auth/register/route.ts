import { NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth/session-cookie";
import { errorResponse, toErrorResponse } from "@/lib/http/api-error";
import { RATE_LIMITS, rateLimit } from "@/lib/http/rate-limit";
import { registerUser } from "@/services/auth-service";
import { registerSchema } from "@portal/shared/auth";

/** Creates a USER account and starts its session. */
export async function POST(request: Request) {
  const limited = rateLimit(request, RATE_LIMITS.register);
  if (limited) return limited;
  const body: unknown = await request.json().catch(() => undefined);
  if (body === undefined) return errorResponse(400, "El cuerpo de la solicitud debe ser JSON válido");

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return errorResponse(400, parsed.error.issues[0]?.message ?? "Datos de registro inválidos");

  try {
    const user = await registerUser(parsed.data);
    return setSessionCookie(NextResponse.json(user, { status: 201 }), user.id);
  } catch (error) {
    return toErrorResponse(error);
  }
}
