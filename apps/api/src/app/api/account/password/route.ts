import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/authorization";
import { setSessionCookie } from "@/lib/auth/session-cookie";
import { errorResponse, toErrorResponse } from "@/lib/http/api-error";
import { changePassword } from "@/services/account-service";
import { changePasswordSchema } from "@portal/shared/auth";

/** Changes the password of the logged-in user, after checking the current one. Logs out their other devices. */
export async function PUT(request: NextRequest) {
  try {
    const user = await requireUser(request);

    const body: unknown = await request.json().catch(() => undefined);
    if (body === undefined) return errorResponse(400, "El cuerpo de la solicitud debe ser JSON válido");
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) return errorResponse(400, parsed.error.issues[0]?.message ?? "Datos de la contraseña inválidos");

    await changePassword(user, parsed.data);
    // Other sessions are revoked; this one gets a fresh cookie so the user stays logged in here.
    return setSessionCookie(new NextResponse(null, { status: 204 }), user.id);
  } catch (error) {
    return toErrorResponse(error);
  }
}
