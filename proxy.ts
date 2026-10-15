import { NextResponse, type NextRequest } from "next/server";

import { decideRouteAccess } from "@/lib/auth/route-guard";
import { sessionCookieName } from "@/lib/auth/session-cookies";

export function proxy(request: NextRequest) {
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
  matcher: ["/console", "/console/:path*", "/onboarding", "/onboarding/:path*"],
};
