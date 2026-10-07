"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("merchant@crossborder-shop.com");
  const code = ["8", "9", "2", "1", "0", "4"];
  const sentCode = true;
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push("/onboarding");
    }, 400);
  };

  const handleQuickDemo = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push("/console");
    }, 300);
  };

  return (
    <div className="min-h-screen bg-white text-[#09090B] font-sans flex flex-col justify-between selection:bg-[#09090B] selection:text-white">
      {/* 顶部商户导航 */}
      <header className="h-16 border-b border-[#E4E4E7] px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-mono text-base font-bold tracking-tight text-[#09090B]">
            SolaFlow
          </span>
          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 bg-[#09090B] text-white">
            AI
          </span>
        </Link>
        <div className="text-xs font-mono text-[#71717A]">
          东南亚跨境电商 WhatsApp 订单助手
        </div>
      </header>

      {/* 居中商户登录卡片 */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md border border-[#E4E4E7] bg-white p-8 space-y-6">
          <div className="space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#71717A]">
              SOLAFLOW CONSOLE · MERCHANT AUTH
            </div>
            <h1 className="text-xl font-mono font-bold uppercase text-[#09090B]">
              商家工作台免密登录
            </h1>
            <p className="text-xs text-[#71717A] font-mono">
              输入工作邮箱获取 6 位动态验证码，免去繁琐密码记忆
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-xs font-mono">
            <div>
              <label className="text-[#71717A] uppercase text-[10px] block mb-1">
                商家工作邮箱 (Work Email)
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-[#71717A]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#E4E4E7] focus:outline-none focus:border-[#09090B]"
                  required
                />
              </div>
            </div>

            {sentCode && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[#71717A] uppercase text-[10px]">
                    输入 6 位动态验证码
                  </label>
                  <span className="text-[10px] text-[#059669]">已发送验证码至邮箱</span>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {code.map((digit, i) => (
                    <input
                      key={i}
                      type="text"
                      maxLength={1}
                      defaultValue={digit}
                      className="h-11 text-center font-mono font-bold text-base border border-[#E4E4E7] focus:outline-none focus:border-[#09090B] bg-[#FAFAFA]"
                    />
                  ))}
                </div>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full h-11 text-xs">
              {loading ? "正在验证身份..." : "登录进入商户工作台"}
            </Button>

            {/* 快速体验 Demo */}
            <div className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleQuickDemo}
                className="w-full h-10 text-xs"
              >
                一键以演示商户身份直接进入控制台
              </Button>
            </div>
          </form>

          <div className="pt-4 border-t border-[#E4E4E7] text-[10px] font-mono text-[#71717A] text-center">
            登录即代表您同意 SolaFlow 出海商户服务条款与 Meta 商业数据处理协议
          </div>
        </div>
      </main>

      {/* 底部版权 */}
      <footer className="h-12 border-t border-[#E4E4E7] px-6 flex items-center justify-between text-[11px] font-mono text-[#71717A]">
        <span>SolaFlow AI © 2026</span>
        <span>Secure Auth • Solana L1 Finalized</span>
      </footer>
    </div>
  );
}
