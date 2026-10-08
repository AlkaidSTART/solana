"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { RotateCw, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { parseOAuthCallbackParams } from "@/lib/auth/neon-auth";
import { useAppStore } from "@/stores/use-app-store";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useAppStore();

  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isEn = locale === "en_US";
  const isId = locale === "id_ID";

  useEffect(() => {
    const params = parseOAuthCallbackParams(searchParams);

    if (params.error) {
      setStatus("error");
      setErrorMessage(
        params.errorDescription ||
          params.error ||
          (isEn
            ? "OAuth authorization failed. Please try again."
            : "第三方授权失败，请重试。")
      );
      return;
    }

    // 凭据核验与回写
    const timer = setTimeout(() => {
      setStatus("success");
      const redirectTimer = setTimeout(() => {
        router.push("/console");
      }, 600);
      return () => clearTimeout(redirectTimer);
    }, 800);

    return () => clearTimeout(timer);
  }, [searchParams, router, isEn]);

  return (
    <div className="w-full max-w-[420px] mx-auto border border-zinc-200 bg-white p-8 space-y-6 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] font-mono text-center">
      <div className="space-y-2">
        <div className="text-[10px] tracking-wider uppercase text-zinc-400">
          NEON AUTH // OAUTH PIPELINE
        </div>
        <h1 className="text-xl font-bold text-zinc-950">
          {status === "processing"
            ? isEn
              ? "Verifying OAuth Session..."
              : isId
              ? "Memverifikasi Sesi OAuth..."
              : "正在完成第三方授权核验..."
            : status === "success"
            ? isEn
              ? "Authentication Successful"
              : isId
              ? "Autentikasi Berhasil"
              : "第三方登录核验通过"
            : isEn
            ? "Authentication Failed"
            : isId
            ? "Autentikasi Gagal"
            : "授权未通过"}
        </h1>
        <p className="text-xs text-zinc-500 leading-relaxed">
          {status === "processing"
            ? isEn
              ? "Exchanging tokens with Neon Auth service and preparing workspace."
              : "正在与 Neon Auth 服务节点交换安全令牌并初始化工作台环境。"
            : status === "success"
            ? isEn
              ? "Redirecting to merchant console..."
              : "正在为您跳转至商户安全控制台..."
            : errorMessage}
        </p>
      </div>

      {/* 状态徽标与动画 */}
      <div className="py-6 flex items-center justify-center">
        {status === "processing" && (
          <div className="w-12 h-12 border border-zinc-200 flex items-center justify-center bg-zinc-50">
            <RotateCw className="w-5 h-5 text-zinc-800 animate-spin" />
          </div>
        )}
        {status === "success" && (
          <div className="w-12 h-12 border border-emerald-200 flex items-center justify-center bg-emerald-50">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
        )}
        {status === "error" && (
          <div className="w-12 h-12 border border-rose-200 flex items-center justify-center bg-rose-50">
            <AlertCircle className="w-6 h-6 text-rose-600" />
          </div>
        )}
      </div>

      {status === "error" ? (
        <div className="space-y-3">
          <Link
            href="/login"
            className="w-full h-10 border border-zinc-950 bg-zinc-950 text-white text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-zinc-800 transition-colors"
          >
            <span>{isEn ? "Back to Sign In" : "返回登录页面"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-500 pt-2 border-t border-zinc-100">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Neon Auth 安全加密通道</span>
        </div>
      )}
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen bg-zinc-50/60 flex items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="p-8 font-mono text-xs text-zinc-500 flex items-center gap-2">
            <RotateCw className="w-4 h-4 animate-spin text-zinc-700" />
            <span>Loading OAuth Context...</span>
          </div>
        }
      >
        <CallbackContent />
      </Suspense>
    </div>
  );
}
