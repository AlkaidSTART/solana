"use client";

import React, { useState } from "react";
import { clsx } from "clsx";
import { RotateCw, AlertCircle } from "lucide-react";
import { initiateOAuthSignIn, type OAuthProvider } from "@/lib/auth/neon-auth";
import { useAppStore } from "@/stores/use-app-store";

interface OAuthButtonsProps {
  className?: string;
  onError?: (error: string) => void;
}

export function OAuthButtons({ className, onError }: OAuthButtonsProps) {
  const { locale } = useAppStore();
  const [activeProvider, setActiveProvider] = useState<OAuthProvider | null>(null);

  const isEn = locale === "en_US";
  const isId = locale === "id_ID";

  const t = {
    google: isEn ? "Continue with Google" : isId ? "Lanjutkan dengan Google" : "使用 Google 账号登录",
    github: isEn ? "Continue with GitHub" : isId ? "Lanjutkan dengan GitHub" : "使用 GitHub 账号登录",
    divider: isEn ? "OR CONTINUE WITH SOCIAL" : isId ? "ATAU MASUK DENGAN SOSIAL" : "或使用第三方快捷登录",
  };

  const handleOAuth = async (provider: OAuthProvider) => {
    setActiveProvider(provider);
    try {
      await initiateOAuthSignIn(provider);
    } catch (err: unknown) {
      setActiveProvider(null);
      const message =
        err instanceof Error
          ? err.message
          : isEn
          ? "Failed to initiate OAuth login. Check Neon Auth configuration."
          : "无法发起第三方登录，请检查 Neon Auth 服务配置。";
      onError?.(message);
    }
  };

  return (
    <div className={clsx("space-y-3 font-mono", className)}>
      {/* 分割线 */}
      <div className="relative flex items-center justify-center my-3">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-200" />
        </div>
        <span className="relative bg-white px-3 text-[10px] uppercase tracking-wider text-zinc-400">
          {t.divider}
        </span>
      </div>

      {/* 按钮网格 */}
      <div className="grid grid-cols-2 gap-2">
        {/* Google 登录 */}
        <button
          type="button"
          onClick={() => handleOAuth("google")}
          disabled={activeProvider !== null}
          className="h-10 px-3 border border-zinc-200 hover:border-zinc-950 bg-white hover:bg-zinc-50/80 text-zinc-800 text-xs font-mono flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={t.google}
        >
          {activeProvider === "google" ? (
            <RotateCw className="w-3.5 h-3.5 animate-spin text-zinc-600" />
          ) : (
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span className="truncate">Google</span>
        </button>

        {/* GitHub 登录 */}
        <button
          type="button"
          onClick={() => handleOAuth("github")}
          disabled={activeProvider !== null}
          className="h-10 px-3 border border-zinc-200 hover:border-zinc-950 bg-white hover:bg-zinc-50/80 text-zinc-800 text-xs font-mono flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={t.github}
        >
          {activeProvider === "github" ? (
            <RotateCw className="w-3.5 h-3.5 animate-spin text-zinc-600" />
          ) : (
            <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
          )}
          <span className="truncate">GitHub</span>
        </button>
      </div>
    </div>
  );
}
