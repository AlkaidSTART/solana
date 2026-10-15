import { NextResponse, type NextRequest } from "next/server";

import { neonAuth } from "@/lib/auth/server";
import { decideRouteAccess, LOGIN_PATH, OAUTH_CALLBACK_PATH } from "@/lib/auth/route-guard";
import { sessionCookieName } from "@/lib/auth/session-cookies";

type NeonAuthProxy = (request: NextRequest) => Promise<NextResponse>;

let neonAuthProxy: NeonAuthProxy | null = null;

/**
 * The SDK's middleware completes the OAuth handshake: it exchanges the session challenge cookie
 * plus `?neon_auth_session_verifier=` for the session cookie on this origin. Without it the
 * callback can never see a Neon identity, so the local session bridge always answers 401.
 */
function resolveNeonAuthProxy(): NeonAuthProxy {
  neonAuthProxy ??= neonAuth().middleware({ loginUrl: LOGIN_PATH });
  return neonAuthProxy;
}

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === OAUTH_CALLBACK_PATH) {
    return resolveNeonAuthProxy()(request);
  }

  const decision = decideRouteAccess({
    pathname: request.nextUrl.pathname,
    hasSession: request.cookies.has(sessionCookieName()),
  });

  if (decision.action === "redirect") {
    return NextResponse.redirect(new URL(decision.to, request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Next.js resolves this field statically, so the entries must stay as literals.
  matcher: [
    "/console",
    "/console/:path*",
    "/onboarding",
    "/onboarding/:path*",
    "/auth/callback",
  ],
};
