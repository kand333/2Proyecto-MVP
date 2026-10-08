import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/authorization";
import { errorResponse, toErrorResponse } from "@/lib/http/api-error";
import { deleteUserByAdmin, updateUserByAdmin } from "@/services/admin-user-service";
import { adminUserUpdateSchema, userIdSchema } from "@portal/shared/admin-user";

type UserContext = RouteContext<"/api/admin/users/[id]">;

const INVALID_ID = "Identificador de usuario inválido";

/** Edits a user's data (name, email, new password), status and/or role. ADMIN only. */
export async function PATCH(request: NextRequest, context: UserContext) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await context.params;
    if (!userIdSchema.safeParse(id).success) return errorResponse(400, INVALID_ID);
    const body: unknown = await request.json().catch(() => undefined);
    if (body === undefined) return errorResponse(400, "El cuerpo de la solicitud debe ser JSON válido");
    const parsed = adminUserUpdateSchema.safeParse(body);
    if (!parsed.success) return errorResponse(400, parsed.error.issues[0]?.message ?? "Cambio inválido");
    return NextResponse.json(await updateUserByAdmin(admin, id, parsed.data));
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** Deletes a user for good. ADMIN only. */
export async function DELETE(request: NextRequest, context: UserContext) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await context.params;
    if (!userIdSchema.safeParse(id).success) return errorResponse(400, INVALID_ID);
    await deleteUserByAdmin(admin, id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
