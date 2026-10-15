/**
 * SolaFlow AI - Neon Auth & OAuth 适配层
 * 对接托管于 Neon Auth 服务的认证端点与第三方 OAuth (Google)
 */

export type OAuthProvider = "google";

export interface NeonAuthConfig {
  authUrl: string;
  defaultCallbackUrl: string;
}

export interface OAuthUserInfo {
  id?: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  provider: OAuthProvider;
}

/**
 * 获取当前环境配置的 Neon Auth 端点基础 URL
 * 优先读取 NEXT_PUBLIC_NEON_AUTH_URL，兼容 VITE_NEON_AUTH_URL 与 NEON_AUTH_URL
 */
export function getNeonAuthUrl(): string {
  if (typeof process !== "undefined" && process.env) {
    if (process.env.NEXT_PUBLIC_NEON_AUTH_URL) {
      return process.env.NEXT_PUBLIC_NEON_AUTH_URL;
    }
    if (process.env.VITE_NEON_AUTH_URL) {
      return process.env.VITE_NEON_AUTH_URL;
    }
    if (process.env.NEON_AUTH_URL) {
      return process.env.NEON_AUTH_URL;
    }
  }
  return "https://ep-falling-sky-b5fgcy67.neonauth.c-7.us-east-2.aws.neon.tech/neondb/auth";
}

/**
 * 构造第三方 OAuth 授权跳转 URL
 */
export function getOAuthAuthorizationUrl(
  provider: OAuthProvider,
  options?: { callbackUrl?: string; prompt?: string }
): string {
  const baseUrl = getNeonAuthUrl().replace(/\/+$/, "");
  const callbackUrl =
    options?.callbackUrl ||
    (typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback`
      : "/auth/callback");

  const url = new URL(`${baseUrl}/sign-in/social`);
  url.searchParams.set("provider", provider);
  url.searchParams.set("callbackURL", callbackUrl);
  if (options?.prompt) {
    url.searchParams.set("prompt", options.prompt);
  }
  return url.toString();
}

/**
 * 发起第三方 OAuth 登录重定向
 */
export async function initiateOAuthSignIn(
  provider: OAuthProvider,
  options?: { callbackUrl?: string }
): Promise<void> {
  const authUrl = getOAuthAuthorizationUrl(provider, options);
  if (typeof window !== "undefined") {
    window.location.href = authUrl;
  }
}

/**
 * 解析并处理 OAuth 重定向回调参数
 */
export function parseOAuthCallbackParams(searchParams: URLSearchParams): {
  code?: string;
  state?: string;
  error?: string;
  errorDescription?: string;
} {
  return {
    code: searchParams.get("code") || searchParams.get("token") || undefined,
    state: searchParams.get("state") || undefined,
    error: searchParams.get("error") || undefined,
    errorDescription:
      searchParams.get("error_description") || searchParams.get("errorDescription") || undefined,
  };
}
