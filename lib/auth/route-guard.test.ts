import { describe, expect, it } from "vitest";

import { decideRouteAccess, isProtectedPath } from "./route-guard";

describe("console route guard", () => {
  it("protects the console and onboarding trees, including their roots", () => {
    for (const pathname of [
      "/console",
      "/console/",
      "/console/billing",
      "/console/billing/sol-test",
      "/onboarding",
    ]) {
      expect(isProtectedPath(pathname), pathname).toBe(true);
    }
  });

  it("does not protect lookalike prefixes or public pages", () => {
    for (const pathname of [
      "/consoleX",
      "/consoles",
      "/onboarding-extra",
      "/",
      "/login",
      "/register",
      "/auth/callback",
      "/api/v1/payments/session",
    ]) {
      expect(isProtectedPath(pathname), pathname).toBe(false);
    }
  });

  it("redirects anonymous visitors to the login page", () => {
    expect(decideRouteAccess({ pathname: "/console/billing", hasSession: false })).toEqual({
      action: "redirect",
      to: "/login",
    });
  });

  it("allows authenticated visitors", () => {
    expect(decideRouteAccess({ pathname: "/console/billing", hasSession: true })).toEqual({
      action: "allow",
    });
  });

  it("allows public pages with or without a session", () => {
    for (const hasSession of [true, false]) {
      expect(decideRouteAccess({ pathname: "/login", hasSession })).toEqual({ action: "allow" });
      expect(decideRouteAccess({ pathname: "/", hasSession })).toEqual({ action: "allow" });
    }
  });
});
