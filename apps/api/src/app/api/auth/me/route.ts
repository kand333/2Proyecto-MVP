import { NextResponse, type NextRequest } from "next/server";
import { clearSessionCookie, readSession } from "@/lib/auth/session-cookie";
import { errorResponse, toErrorResponse } from "@/lib/http/api-error";
import { getActiveUser } from "@/services/auth-service";

/** The authenticated user, or 401. A session of a deleted or deactivated user, or a revoked one, is removed. */
export async function GET(request: NextRequest) {
  const session = readSession(request);
  if (!session) return errorResponse(401, "No has iniciado sesión");

  try {
    const user = await getActiveUser(session);
    if (!user) {
      return clearSessionCookie(NextResponse.json({ message: "No has iniciado sesión", status: 401 }, { status: 401 }));
    }
    return NextResponse.json(user, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return toErrorResponse(error);
  }
}
