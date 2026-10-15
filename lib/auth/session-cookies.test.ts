import { describe, expect, it } from "vitest";

import { csrfCookieName, sessionCookieName } from "./session-cookies";

describe("session cookie names", () => {
  it("uses the __Host- prefix only in production", () => {
    expect(sessionCookieName(true)).toBe("__Host-solaflow_session");
    expect(sessionCookieName(false)).toBe("solaflow_session");
    expect(csrfCookieName(true)).toBe("__Host-solaflow_csrf");
    expect(csrfCookieName(false)).toBe("solaflow_csrf");
  });
});
