import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/authorization";
import { errorResponse, toErrorResponse } from "@/lib/http/api-error";
import { getSettings, updateSettings } from "@/services/settings-service";
import { shopSettingsSchema } from "@portal/shared/settings";

/** Every shop setting. ADMIN only. */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    return NextResponse.json(await getSettings(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** Replaces the shop settings; checkout uses them at once (RF-10). ADMIN only. */
export async function PUT(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body: unknown = await request.json().catch(() => undefined);
    if (body === undefined) return errorResponse(400, "El cuerpo de la solicitud debe ser JSON válido");
    const parsed = shopSettingsSchema.safeParse(body);
    if (!parsed.success) return errorResponse(400, parsed.error.issues[0]?.message ?? "Ajustes inválidos");
    return NextResponse.json(await updateSettings(parsed.data));
  } catch (error) {
    return toErrorResponse(error);
  }
}
