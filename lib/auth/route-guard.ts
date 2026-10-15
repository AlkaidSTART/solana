export const PROTECTED_PREFIXES = ["/console", "/onboarding"] as const;
export const LOGIN_PATH = "/login";
export const OAUTH_CALLBACK_PATH = "/auth/callback";

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export type RouteAccess = { action: "allow" } | { action: "redirect"; to: string };

/**
 * Optimistic gate for page navigations. The session cookie's presence is the only signal available
 * to the proxy, so a forged cookie still only yields an empty shell — every data request re-checks
 * the session server-side, which stays the authority for authorization.
 */
export function decideRouteAccess(input: { pathname: string; hasSession: boolean }): RouteAccess {
  if (!isProtectedPath(input.pathname)) {
    return { action: "allow" };
  }
  if (input.hasSession) {
    return { action: "allow" };
  }
  return { action: "redirect", to: LOGIN_PATH };
}
