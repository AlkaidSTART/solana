"use client";

import React, { useState } from "react";
import { clsx } from "clsx";
import { RotateCw } from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { useAppStore } from "@/stores/use-app-store";

interface OAuthButtonsProps {
  className?: string;
  onError?: (error: string) => void;
}

export function OAuthButtons({ className, onError }: OAuthButtonsProps) {
  const { locale } = useAppStore();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const isEn = locale === "en_US";
  const isId = locale === "id_ID";

  const t = {
    google: isEn ? "Continue with Google" : isId ? "Lanjutkan dengan Google" : "使用 Google 账号登录",
    divider: isEn ? "OR CONTINUE WITH SOCIAL" : isId ? "ATAU MASUK DENGAN SOSIAL" : "或使用第三方快捷登录",
  };

  const handleGoogleSignIn = async () => {
    setIsRedirecting(true);
    try {
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: `${window.location.origin}/auth/callback`,
      });
      if (error) throw new Error(error.message);
    } catch (err: unknown) {
      setIsRedirecting(false);
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
    <div className={clsx("space-y-2 font-sans", className)}>
      {/* 分割线 */}
      <div className="relative flex items-center justify-center my-1.5 sm:my-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-100" />
        </div>
        <span className="relative bg-white px-2.5 text-[9px] sm:text-[10px] uppercase tracking-wider text-zinc-400">
          {t.divider}
        </span>
      </div>

      {/* Google 登录 */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isRedirecting}
        className="w-full h-8.5 sm:h-9 px-2.5 border border-zinc-200/80 hover:border-zinc-300 rounded-lg bg-zinc-50/40 hover:bg-zinc-50 text-zinc-700 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
        title={t.google}
      >
        {isRedirecting ? (
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
    </div>
  );
}
