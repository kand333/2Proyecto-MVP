import { NextResponse, type NextRequest } from "next/server";
import { clearSessionCookie, readSessionUserId } from "@/lib/auth/session-cookie";
import { markLoggedOut } from "@/repositories/user-repository";

/** Ends the session by removing its cookie (the user stops showing as online). Succeeds even without a session. */
export async function POST(request: NextRequest) {
  const userId = readSessionUserId(request);
  // Logging out must never fail because of the presence mark.
  if (userId) await markLoggedOut(userId).catch(() => undefined);
  return clearSessionCookie(new NextResponse(null, { status: 204 }));
}
