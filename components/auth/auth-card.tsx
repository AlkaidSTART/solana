"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  Store,
  Globe,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  RotateCw,
} from "lucide-react";
import { clsx } from "clsx";
import { Button } from "@/components/ui/button";
import { MOCK_DEMO_LOGIN_CREDENTIALS } from "@/mock";
import { useAppStore } from "@/stores/use-app-store";
import {
  validateEmail,
  calculatePasswordStrength,
  sanitizeOtpPaste,
  isOtpComplete,
} from "./auth-utils";

export type AuthMode = "login" | "register";
export type LoginMethod = "otp" | "password";

interface AuthCardProps {
  initialMode?: AuthMode;
}

export function AuthCard({ initialMode = "login" }: AuthCardProps) {
  const router = useRouter();
  const { locale } = useAppStore();

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("otp");

  // 表单字段
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [storeName, setStoreName] = useState("");
  const [targetMarket, setTargetMarket] = useState("id_ID");
  const [otpCode, setOtpCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // 状态机
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // OTP 6 单元格 refs
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // 倒计时逻辑
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // 国际化轻量映射
  const isEn = locale === "en_US";
  const isId = locale === "id_ID";

  const t = {
    titleLogin: isEn
      ? "Merchant Portal Sign In"
      : isId
      ? "Masuk Portal Merchant"
      : "商户工作台登录",
    titleRegister: isEn
      ? "Create Merchant Account"
      : isId
      ? "Daftar Akun Merchant"
      : "开启商户注册",
    descLogin: isEn
      ? "Access Southeast Asia WhatsApp order & recovery console."
      : isId
      ? "Akses dasbor pesanan & pemulihan WhatsApp Asia Tenggara."
      : "出海东南亚 WhatsApp 订单转化与智能追单控制台。",
    descRegister: isEn
      ? "14-day free trial with 100 free Credits included on activation."
      : isId
      ? "Uji coba gratis 14 hari dengan 100 Kredit gratis saat aktivasi."
      : "注册即享 14 天免费试用，激活即赠 100 Credits 体验额度。",
    tabLogin: isEn ? "Sign In" : isId ? "Masuk" : "商户登录",
    tabRegister: isEn ? "Register" : isId ? "Daftar" : "注册账号",
    methodOtp: isEn ? "Email OTP (Passwordless)" : isId ? "Kode OTP Email" : "邮箱动态免密码",
    methodPassword: isEn ? "Password" : isId ? "Kata Sandi" : "账号密码登录",
    emailLabel: isEn ? "Work Email" : isId ? "Email Bisnis" : "商家工作邮箱",
    emailPlaceholder: "merchant@crossborder-shop.com",
    storeNameLabel: isEn ? "Merchant / Store Name" : isId ? "Nama Toko / Bisnis" : "店铺或品牌名称",
    storeNamePlaceholder: isEn ? "e.g. Jakarta Boutique Store" : "例如：Jakarta Fashion Hub",
    marketLabel: isEn ? "Target Market" : isId ? "Pasar Target" : "主营出海市场",
    passwordLabel: isEn ? "Password" : isId ? "Kata Sandi" : "登录密码",
    confirmPasswordLabel: isEn ? "Confirm Password" : isId ? "Konfirmasi Sandi" : "确认密码",
    sendOtpBtn: isEn ? "Send Code" : isId ? "Kirim OTP" : "发送验证码",
    resendOtpBtn: isEn ? "Resend" : isId ? "Kirim Ulang" : "重新获取",
    otpHint: isEn
      ? "Enter 6-digit dynamic code sent to your email:"
      : isId
      ? "Masukkan 6 digit kode yang dikirim ke email:"
      : "请输入已发送至您邮箱的 6 位动态验证码：",
    submitLogin: isEn ? "Sign In to Console" : isId ? "Masuk ke Konsol" : "登录进入商户工作台",
    submitRegister: isEn
      ? "Create Account & Start Onboarding"
      : isId
      ? "Daftar & Mulai Panduan"
      : "立即注册并进入入驻向导",
    quickDemoBtn: isEn
      ? "Instant Demo Access (Jump directly to console)"
      : isId
      ? "Akses Demo Cepat (Langsung ke konsol)"
      : "一键以演示商户身份直接进入控制台",
    fillDemoBadge: isEn ? "Fill Demo Credentials" : isId ? "Isi Kredensial Demo" : "填入演示凭据",
    termsText: isEn
      ? "By continuing, you agree to SolaFlow Merchant Terms and Meta BAA Data Agreement."
      : isId
      ? "Dengan melanjutkan, Anda menyetujui Ketentuan Merchant SolaFlow dan Perjanjian Meta BAA."
      : "登录或注册即代表您同意 SolaFlow 出海商户服务协议与 Meta 商业数据处理附约 (BAA)",
  };

  // 发送验证码
  const handleSendOtp = () => {
    setErrorMsg(null);
    if (!validateEmail(email)) {
      setErrorMsg(
        isEn
          ? "Please enter a valid work email address."
          : isId
          ? "Silakan masukkan alamat email yang valid."
          : "请输入有效的商家工作邮箱地址。"
      );
      return;
    }

    setOtpSent(true);
    setCountdown(60);
    setSuccessMsg(
      isEn
        ? `Verification code sent to ${email} (Demo code: 892104)`
        : isId
        ? `Kode OTP dikirim ke ${email} (Kode demo: 892104)`
        : `动态验证码已发送至 ${email}（测试演示码：892104）`
    );

    // 聚焦第一个 OTP 格
    setTimeout(() => {
      otpInputsRef.current[0]?.focus();
    }, 100);
  };

  // 一键填入演示凭据
  const handleFillDemo = () => {
    setErrorMsg(null);
    setEmail(MOCK_DEMO_LOGIN_CREDENTIALS.email);
    setOtpSent(true);
    setOtpCode([...MOCK_DEMO_LOGIN_CREDENTIALS.code]);
    setPassword("DemoMerchant2026!");
    setStoreName("Jakarta Trends Hub");
    setSuccessMsg(
      isEn
        ? "Demo credentials loaded (merchant@crossborder-shop.com / 892104)"
        : "已快速载入演示商户账号与验证码凭据"
    );
  };

  // 处理 6 位 OTP 输入
  const handleOtpChange = (index: number, val: string) => {
    setErrorMsg(null);
    const cleaned = val.replace(/\D/g, "");
    if (!cleaned) {
      const next = [...otpCode];
      next[index] = "";
      setOtpCode(next);
      return;
    }

    // 单字符输入
    const next = [...otpCode];
    next[index] = cleaned.slice(-1);
    setOtpCode(next);

    // 自动聚焦下一个输入框
    if (index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  // 处理 OTP 按键（退格）
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otpCode[index] && index > 0) {
        otpInputsRef.current[index - 1]?.focus();
      }
    }
  };

  // 处理 OTP 粘贴
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text");
    const sanitized = sanitizeOtpPaste(pasteData);
    setOtpCode(sanitized);

    const nonBlankCount = sanitized.filter(Boolean).length;
    const focusIdx = Math.min(Math.max(nonBlankCount, 1) - 1, 5);
    otpInputsRef.current[focusIdx]?.focus();
  };

  // 提交登录
  const handleSubmitLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!validateEmail(email)) {
      setErrorMsg(isEn ? "Please enter a valid work email." : "请输入有效的商家工作邮箱。");
      return;
    }

    if (loginMethod === "otp") {
      if (!isOtpComplete(otpCode)) {
        setErrorMsg(isEn ? "Please enter all 6 digits of the OTP code." : "请输入完整的 6 位动态验证码。");
        return;
      }
    } else {
      if (!password || password.length < 6) {
        setErrorMsg(isEn ? "Password must be at least 6 characters." : "密码长度不能少于 6 位。");
        return;
      }
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccessMsg(
        isEn
          ? "Authenticated successfully! Redirecting to workspace..."
          : "身份核验通过，正在跳转至工作台..."
      );
      setTimeout(() => {
        router.push("/console");
      }, 500);
    }, 600);
  };

  // 提交注册
  const handleSubmitRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!validateEmail(email)) {
      setErrorMsg(isEn ? "Please provide a valid work email." : "请输入合法的商户工作邮箱。");
      return;
    }
    if (!storeName.trim()) {
      setErrorMsg(isEn ? "Please enter your store or business name." : "请输入您的店铺或商户名称。");
      return;
    }
    if (!password || password.length < 8) {
      setErrorMsg(
        isEn
          ? "Password must be at least 8 characters long."
          : "为了您的商户资金安全，密码长度不能少于 8 位。"
      );
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg(isEn ? "Passwords do not match." : "两次输入的密码不一致，请重新核对。");
      return;
    }
    if (!agreedTerms) {
      setErrorMsg(isEn ? "You must agree to the merchant terms." : "请勾选同意出海商户服务条款与 Meta 协议。");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccessMsg(
        isEn
          ? "Account created successfully! 100 trial credits issued. Redirecting to onboarding..."
          : "🎉 商户账号注册成功！已发放 100 Credits 试用额度，正在进入 6 步入驻向导..."
      );
      setTimeout(() => {
        router.push("/onboarding");
      }, 700);
    }, 700);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* 认证卡片主体 */}
      <div className="border border-zinc-200 bg-white p-6 sm:p-8 space-y-6 shadow-xs relative">
        {/* 顶部单色徽标与标头 */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
              SOLAFLOW CONSOLE // MERCHANT AUTH
            </span>
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-[10px] font-mono text-zinc-600 hover:text-zinc-950 underline flex items-center gap-1 cursor-pointer"
              title="一键自动填充测试账号信息"
            >
              <Sparkles className="w-3 h-3 text-zinc-800" />
              <span>{t.fillDemoBadge}</span>
            </button>
          </div>

          <h1 className="text-xl font-mono font-bold uppercase tracking-tight text-zinc-950">
            {mode === "login" ? t.titleLogin : t.titleRegister}
          </h1>
          <p className="text-xs text-zinc-500 font-mono leading-relaxed">
            {mode === "login" ? t.descLogin : t.descRegister}
          </p>
        </div>

        {/* 模式切换 Tab 胶囊 */}
        <div className="grid grid-cols-2 p-1 bg-zinc-100 border border-zinc-200 text-xs font-mono">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setErrorMsg(null);
            }}
            className={clsx(
              "py-1.5 transition-colors font-medium flex items-center justify-center gap-1 cursor-pointer",
              mode === "login"
                ? "bg-white text-zinc-950 shadow-xs border border-zinc-200/80"
                : "text-zinc-500 hover:text-zinc-950"
            )}
          >
            <span>{t.tabLogin}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setErrorMsg(null);
            }}
            className={clsx(
              "py-1.5 transition-colors font-medium flex items-center justify-center gap-1 cursor-pointer",
              mode === "register"
                ? "bg-white text-zinc-950 shadow-xs border border-zinc-200/80"
                : "text-zinc-500 hover:text-zinc-950"
            )}
          >
            <span>{t.tabRegister}</span>
            <span className="text-[9px] px-1 py-0.2 bg-zinc-900 text-white rounded font-mono">
              +100
            </span>
          </button>
        </div>

        {/* 状态消息横条 (成功 / 错误) */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1 leading-snug">{errorMsg}</div>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono flex items-start gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            <div className="flex-1 leading-snug">{successMsg}</div>
          </div>
        )}

        {/* ================= 模式 1: 登录视图 ================= */}
        {mode === "login" && (
          <form onSubmit={handleSubmitLogin} className="space-y-4 text-xs font-mono">
            {/* 登录子方式切换 (OTP / 密码) */}
            <div className="flex items-center justify-between border-b border-zinc-200 pb-2 text-[11px]">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setLoginMethod("otp")}
                  className={clsx(
                    "cursor-pointer pb-0.5 transition-colors font-medium",
                    loginMethod === "otp"
                      ? "text-zinc-950 border-b-2 border-zinc-950"
                      : "text-zinc-400 hover:text-zinc-700"
                  )}
                >
                  {t.methodOtp}
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMethod("password")}
                  className={clsx(
                    "cursor-pointer pb-0.5 transition-colors font-medium",
                    loginMethod === "password"
                      ? "text-zinc-950 border-b-2 border-zinc-950"
                      : "text-zinc-400 hover:text-zinc-700"
                  )}
                >
                  {t.methodPassword}
                </button>
              </div>

              {loginMethod === "otp" && otpSent && (
                <span className="text-[10px] text-emerald-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  已发送
                </span>
              )}
            </div>

            {/* 邮箱输入框 */}
            <div>
              <label className="text-zinc-500 uppercase text-[10px] block mb-1">
                {t.emailLabel}
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  className="w-full pl-9 pr-24 py-2 bg-white border border-zinc-200 focus:outline-none focus:border-zinc-950 text-xs font-mono"
                  required
                />
                {loginMethod === "otp" && (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={countdown > 0}
                    className="absolute right-1.5 top-1.5 px-2.5 py-1 text-[10px] font-mono border border-zinc-200 hover:border-zinc-950 bg-zinc-50 hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    {countdown > 0 ? `${countdown}s` : otpSent ? t.resendOtpBtn : t.sendOtpBtn}
                  </button>
                )}
              </div>
            </div>

            {/* OTP 模式：6 位验证码输入 */}
            {loginMethod === "otp" && otpSent && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-zinc-500 uppercase text-[10px]">
                    {t.otpHint}
                  </label>
                  <span className="text-[10px] text-zinc-400">支持直接粘贴 6 位</span>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {otpCode.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        otpInputsRef.current[i] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      onPaste={handleOtpPaste}
                      className="h-11 text-center font-mono font-bold text-base border border-zinc-200 focus:outline-none focus:border-zinc-950 bg-zinc-50/50 selection:bg-zinc-900 selection:text-white"
                      aria-label={`OTP 验证码第 ${i + 1} 位`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 密码模式：密码输入框 */}
            {loginMethod === "password" && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-zinc-500 uppercase text-[10px] block">
                    {t.passwordLabel}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMethod("otp");
                      handleSendOtp();
                    }}
                    className="text-[10px] text-zinc-500 hover:text-zinc-950 underline cursor-pointer"
                  >
                    忘记密码？免密登录
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-9 py-2 bg-white border border-zinc-200 focus:outline-none focus:border-zinc-950 text-xs font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                    aria-label={showPassword ? "隐藏密码" : "显示密码"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* 登录主行动按钮 */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 text-xs font-mono uppercase tracking-wider bg-zinc-950 hover:bg-zinc-800 text-white rounded-none cursor-pointer mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  验证中...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  {t.submitLogin}
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              )}
            </Button>

            {/* 快速演示通道 */}
            <div className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setLoading(true);
                  setTimeout(() => {
                    setLoading(false);
                    router.push("/console");
                  }, 300);
                }}
                className="w-full h-10 text-xs font-mono border-zinc-200 hover:bg-zinc-50 rounded-none text-zinc-700 cursor-pointer"
              >
                {t.quickDemoBtn}
              </Button>
            </div>

            {/* 切换到注册 */}
            <div className="text-center pt-1 text-[11px] font-mono text-zinc-500">
              还没有商户账号？{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setErrorMsg(null);
                }}
                className="text-zinc-950 font-semibold underline hover:text-zinc-700 cursor-pointer"
              >
                免费注册（送 100 Credits）
              </button>
            </div>
          </form>
        )}

        {/* ================= 模式 2: 注册视图 ================= */}
        {mode === "register" && (
          <form onSubmit={handleSubmitRegister} className="space-y-3.5 text-xs font-mono">
            {/* 工作邮箱 */}
            <div>
              <label className="text-zinc-500 uppercase text-[10px] block mb-1">
                {t.emailLabel} *
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-200 focus:outline-none focus:border-zinc-950 text-xs font-mono"
                  required
                />
              </div>
            </div>

            {/* 店铺名称 */}
            <div>
              <label className="text-zinc-500 uppercase text-[10px] block mb-1">
                {t.storeNameLabel} *
              </label>
              <div className="relative">
                <Store className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-400" />
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder={t.storeNamePlaceholder}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-200 focus:outline-none focus:border-zinc-950 text-xs font-mono"
                  required
                />
              </div>
            </div>

            {/* 首发市场 */}
            <div>
              <label className="text-zinc-500 uppercase text-[10px] block mb-1">
                {t.marketLabel}
              </label>
              <div className="relative">
                <Globe className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-400" />
                <select
                  value={targetMarket}
                  onChange={(e) => setTargetMarket(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-200 focus:outline-none focus:border-zinc-950 text-xs font-mono appearance-none cursor-pointer"
                >
                  <option value="id_ID">🇮🇩 印度尼西亚 (Indonesia · +62 COD / 催付重点)</option>
                  <option value="th_TH">🇹🇭 泰国 (Thailand · +66)</option>
                  <option value="en_SG">🇸🇬 新加坡 / 东南亚英文区 (Singapore · +65)</option>
                  <option value="ms_MY">🇲🇾 马来西亚 (Malaysia · +60)</option>
                  <option value="vi_VN">🇻🇳 越南 (Vietnam · +84)</option>
                  <option value="fil_PH">🇵🇭 菲律宾 (Philippines · +63)</option>
                </select>
              </div>
            </div>

            {/* 设置密码 */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-zinc-500 uppercase text-[10px] block">
                  {t.passwordLabel} (至少 8 位) *
                </label>
                {password.length > 0 && (() => {
                  const strength = calculatePasswordStrength(password);
                  return (
                    <div className="flex items-center gap-1.5 text-[9px] font-mono">
                      <span className="text-zinc-400">强度:</span>
                      <span
                        className={clsx(
                          "font-medium",
                          strength.level === "weak"
                            ? "text-rose-600"
                            : strength.level === "medium"
                            ? "text-amber-600"
                            : "text-emerald-600"
                        )}
                      >
                        {isEn ? strength.labelEn : strength.labelZh}
                      </span>
                    </div>
                  );
                })()}
              </div>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少 8 位字母及字符组合"
                  className="w-full pl-9 pr-9 py-2 bg-white border border-zinc-200 focus:outline-none focus:border-zinc-950 text-xs font-mono"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                  aria-label={showPassword ? "隐藏密码" : "显示密码"}
                >
                  {showPassword ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* 确认密码 */}
            <div>
              <label className="text-zinc-500 uppercase text-[10px] block mb-1">
                {t.confirmPasswordLabel} *
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次输入以确认"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-200 focus:outline-none focus:border-zinc-950 text-xs font-mono"
                  required
                />
              </div>
            </div>

            {/* 同意协议 */}
            <div className="pt-1">
              <label className="flex items-start gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="mt-0.5 rounded-none border-zinc-300 text-zinc-950 focus:ring-0 cursor-pointer"
                />
                <span className="text-[10px] font-mono text-zinc-500 leading-tight">
                  我已阅读并同意 SolaFlow 出海服务协议、隐私条款及 Meta 商业数据处理附约
                </span>
              </label>
            </div>

            {/* 注册提交按钮 */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 text-xs font-mono uppercase tracking-wider bg-zinc-950 hover:bg-zinc-800 text-white rounded-none cursor-pointer mt-3"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  创建中...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  {t.submitRegister}
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              )}
            </Button>

            {/* 切换到登录 */}
            <div className="text-center pt-1 text-[11px] font-mono text-zinc-500">
              已有商户账号？{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErrorMsg(null);
                }}
                className="text-zinc-950 font-semibold underline hover:text-zinc-700 cursor-pointer"
              >
                直接登录
              </button>
            </div>
          </form>
        )}

        {/* 底部协议与保障声明 */}
        <div className="pt-4 border-t border-zinc-200 space-y-2 text-[10px] font-mono text-zinc-500 text-center">
          <div className="flex items-center justify-center gap-1.5 text-zinc-600">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Meta BAA 合规直连 · 端到端安全加密</span>
          </div>
          <p className="leading-normal">{t.termsText}</p>
        </div>
      </div>
    </div>
  );
}
