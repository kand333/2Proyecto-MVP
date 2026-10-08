import { NextResponse, type NextRequest } from "next/server";
// Only the cookie name: the proxy must not import server rendering helpers.
import { SESSION_COOKIE_NAME } from "@/lib/session-cookie";

/**
 * Optimistic check for private pages: without a session cookie, go straight to the login (and back
 * afterwards). It only looks at the cookie; the layouts of /account and /admin verify the session
 * and the role with the API, and the API checks them again on every protected request.
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE_NAME)) return NextResponse.next();

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*"],
};
