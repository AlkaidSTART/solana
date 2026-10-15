export const SESSION_COOKIE_BASE = "solaflow_session";
export const CSRF_COOKIE_BASE = "solaflow_csrf";

// Production uses the __Host- prefix, which requires Secure, Path=/ and no Domain attribute.
export function sessionCookieName(isProduction = process.env.NODE_ENV === "production"): string {
  return isProduction ? `__Host-${SESSION_COOKIE_BASE}` : SESSION_COOKIE_BASE;
}

export function csrfCookieName(isProduction = process.env.NODE_ENV === "production"): string {
  return isProduction ? `__Host-${CSRF_COOKIE_BASE}` : CSRF_COOKIE_BASE;
}
