import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getNeonAuthUrl,
  getOAuthAuthorizationUrl,
  parseOAuthCallbackParams,
} from "./neon-auth";

describe("neon-auth - Neon Auth 托管端点与第三方 OAuth 授权集成", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("默认能正确返回配置的 Neon Auth 端点", () => {
    const url = getNeonAuthUrl();
    expect(url).toContain("ep-falling-sky-b5fgcy67.neonauth.c-7.us-east-2.aws.neon.tech/neondb/auth");
  });

  it("当配置了 NEXT_PUBLIC_NEON_AUTH_URL 时优先使用", () => {
    process.env.NEXT_PUBLIC_NEON_AUTH_URL = "https://custom-auth.neon.tech/auth";
    expect(getNeonAuthUrl()).toBe("https://custom-auth.neon.tech/auth");
  });

  it("当配置了 VITE_NEON_AUTH_URL 时亦可生效", () => {
    delete process.env.NEXT_PUBLIC_NEON_AUTH_URL;
    process.env.VITE_NEON_AUTH_URL = "https://vite-auth.neon.tech/auth";
    expect(getNeonAuthUrl()).toBe("https://vite-auth.neon.tech/auth");
  });

  it("能为 Google OAuth 正确构建社交登录授权跳转 URL", () => {
    const authUrl = getOAuthAuthorizationUrl("google", {
      callbackUrl: "https://solana-neon-ten.vercel.app/auth/callback",
    });

    const parsed = new URL(authUrl);
    expect(parsed.pathname).toContain("/sign-in/social");
    expect(parsed.searchParams.get("provider")).toBe("google");
    expect(parsed.searchParams.get("callbackURL")).toBe(
      "https://solana-neon-ten.vercel.app/auth/callback"
    );
  });

  it("能精准解析 OAuth 回调成功参数", () => {
    const params = new URLSearchParams("code=oauth_code_123&state=secure_state");
    const result = parseOAuthCallbackParams(params);
    expect(result.code).toBe("oauth_code_123");
    expect(result.state).toBe("secure_state");
    expect(result.error).toBeUndefined();
  });

  it("能精准解析 OAuth 回调错误参数", () => {
    const params = new URLSearchParams(
      "error=access_denied&error_description=User+cancelled+authorization"
    );
    const result = parseOAuthCallbackParams(params);
    expect(result.error).toBe("access_denied");
    expect(result.errorDescription).toBe("User cancelled authorization");
  });
});
