import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/authorization";
import { errorResponse, toErrorResponse } from "@/lib/http/api-error";
import { createUserByAdmin, listAdminUsers } from "@/services/admin-user-service";
import { adminUserCreateSchema, adminUserListQuerySchema } from "@portal/shared/admin-user";

/** Users (the viewer, then those online, then the rest), with search (name or email), role and status filters. ADMIN only. */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    const parsed = adminUserListQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
    if (!parsed.success) return errorResponse(400, parsed.error.issues[0]?.message ?? "Parámetros de consulta inválidos");
    return NextResponse.json(await listAdminUsers(parsed.data, admin.id), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** Creates an account (USER or ADMIN) with a password set by ADMIN. ADMIN only. */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body: unknown = await request.json().catch(() => undefined);
    if (body === undefined) return errorResponse(400, "El cuerpo de la solicitud debe ser JSON válido");
    const parsed = adminUserCreateSchema.safeParse(body);
    if (!parsed.success) return errorResponse(400, parsed.error.issues[0]?.message ?? "Datos del usuario inválidos");
    return NextResponse.json(await createUserByAdmin(parsed.data), { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
