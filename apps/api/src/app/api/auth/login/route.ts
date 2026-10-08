import { NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth/session-cookie";
import { errorResponse, toErrorResponse } from "@/lib/http/api-error";
import { RATE_LIMITS, rateLimit } from "@/lib/http/rate-limit";
import { authenticateUser } from "@/services/auth-service";
import { loginSchema } from "@portal/shared/auth";

/** Checks the credentials and starts a session (httpOnly cookie). */
export async function POST(request: Request) {
  const limited = rateLimit(request, RATE_LIMITS.login);
  if (limited) return limited;
  const body: unknown = await request.json().catch(() => undefined);
  if (body === undefined) return errorResponse(400, "El cuerpo de la solicitud debe ser JSON válido");

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return errorResponse(400, parsed.error.issues[0]?.message ?? "Datos de ingreso inválidos");

  try {
    const user = await authenticateUser(parsed.data);
    return setSessionCookie(NextResponse.json(user), user.id);
  } catch (error) {
    return toErrorResponse(error);
  }
}
