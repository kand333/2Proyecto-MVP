import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/authorization";
import { errorResponse, toErrorResponse } from "@/lib/http/api-error";
import { updateProfile } from "@/services/account-service";
import { updateProfileSchema } from "@portal/shared/auth";

/** Updates the name and email of the logged-in user. */
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireUser(request);

    const body: unknown = await request.json().catch(() => undefined);
    if (body === undefined) return errorResponse(400, "El cuerpo de la solicitud debe ser JSON válido");
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) return errorResponse(400, parsed.error.issues[0]?.message ?? "Datos de la cuenta inválidos");

    return NextResponse.json(await updateProfile(user, parsed.data));
  } catch (error) {
    return toErrorResponse(error);
  }
}
