"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  ShieldCheck,
  RotateCw,
} from "lucide-react";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/use-app-store";
import { authApi } from "@/lib/api";
import { authClient } from "@/lib/auth/client";
import {
  validateEmail,
  calculatePasswordStrength,
  sanitizeOtpPaste,
  isOtpComplete,
} from "./auth-utils";
import { OAuthButtons } from "./oauth-buttons";

export type AuthMode = "login" | "register";
export type LoginMethod = "otp" | "password";

interface AuthCardProps {
  initialMode?: AuthMode;
  onModeChange?: (mode: AuthMode) => void;
}

const STORAGE_EMAIL_KEY = "solaflow_merchant_remembered_email";

export function AuthCard({ initialMode = "login", onModeChange }: AuthCardProps) {
  const router = useRouter();
  const { locale } = useAppStore();

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("otp");

  // 表单字段
  const [email, setEmail] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem(STORAGE_EMAIL_KEY) || "";
      } catch {
        return "";
      }
    }
    return "";
  });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [storeName, setStoreName] = useState("");
  const [targetMarket, setTargetMarket] = useState("id_ID");
  const [otpCode, setOtpCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [rememberEmail, setRememberEmail] = useState(true);
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // OTP 6 单元格 refs 与自动提交控制
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const isAutoSubmittingRef = useRef(false);

  // 倒计时逻辑
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleModeSwitch = (nextMode: AuthMode) => {
    setMode(nextMode);
    setErrorMsg(null);
    onModeChange?.(nextMode);
  };

  // 国际化映射
  const isEn = locale === "en_US";
  const isId = locale === "id_ID";

  const t = useMemo(
    () => ({
      titleLogin: isEn ? "Merchant Sign In" : isId ? "Masuk Portal Merchant" : "商户登录",
      titleRegister: isEn ? "Open Merchant Account" : isId ? "Daftar Akun Merchant" : "开通商户账号",
      descLogin: isEn
        ? "Access Southeast Asia WhatsApp order & recovery console."
        : isId
        ? "Akses dasbor pesanan & pemulihan WhatsApp Asia Tenggara."
        : "出海东南亚 WhatsApp 订单转化与智能追单控制台。",
      descRegister: isEn
        ? "14-day full access with 100 Credits trial included upon activation."
        : isId
        ? "Akses penuh 14 hari dengan bonus 100 Kredit uji coba saat aktivasi."
        : "14 天全功能试用，激活即赠 100 Credits 体验额度。",
      tabLogin: isEn ? "Sign In" : isId ? "Masuk" : "商户登录",
      tabRegister: isEn ? "Register" : isId ? "Daftar" : "注册账号",
      methodOtp: isEn ? "Email OTP (Passwordless)" : isId ? "Kode OTP Email (Tanpa Sandi)" : "邮箱动态免密",
      methodPassword: isEn ? "Password" : isId ? "Kata Sandi" : "密码登录",
      otpSentBadge: isEn ? "Code Sent" : isId ? "Terkirim" : "已发送",
      emailLabel: isEn ? "Work Email" : isId ? "Email Bisnis" : "商家工作邮箱",
      emailPlaceholder: "merchant@crossborder-shop.com",
      rememberEmail: isEn ? "Remember email on this browser" : isId ? "Ingat email di browser ini" : "在此浏览器记住工作邮箱",
      storeNameLabel: isEn ? "Store / Business Name" : isId ? "Nama Toko / Bisnis" : "店铺或品牌名称",
      storeNamePlaceholder: isEn ? "e.g. Jakarta Fashion Hub" : isId ? "misal: Jakarta Trends Hub" : "例如：Jakarta Trends Hub",
      marketLabel: isEn ? "Primary Target Market" : isId ? "Pasar Target Utama" : "主营出海市场",
      passwordLabel: isEn ? "Password" : isId ? "Kata Sandi" : "登录密码",
      passwordRegisterLabel: isEn ? "Password (at least 8 chars)" : isId ? "Kata Sandi (minimal 8 karakter)" : "登录密码 (至少 8 位)",
      confirmPasswordLabel: isEn ? "Confirm Password" : isId ? "Konfirmasi Sandi" : "确认登录密码",
      pwdPlaceholder: isEn ? "Min 8 alphanumeric chars" : isId ? "Min 8 karakter kombinasi" : "至少 8 位字母及字符组合",
      confirmPwdPlaceholder: isEn ? "Re-enter to confirm" : isId ? "Masukkan ulang untuk konfirmasi" : "再次输入以确认",
      sendOtpBtn: isEn ? "Send Code" : isId ? "Kirim Kode" : "获取验证码",
      resendOtpBtn: isEn ? "Resend" : isId ? "Kirim Ulang" : "重新获取",
      otpHint: isEn
        ? "Enter 6-digit dynamic code sent to your email:"
        : isId
        ? "Masukkan 6 digit kode yang dikirim ke email:"
        : "请输入已发送至您工作邮箱的 6 位动态验证码：",
      otpPasteHint: isEn ? "Paste supported" : isId ? "Bisa tempel langsung" : "支持 6 位直接粘贴",
      autoSubmitHint: isEn ? "Auto-submits on 6th digit" : isId ? "Verifikasi otomatis saat 6 digit terisi" : "输满 6 位自动提交",
      forgotPassword: isEn ? "Forgot password? Passwordless OTP" : isId ? "Lupa kata sandi? Masuk via OTP" : "忘记密码？免密登录",
      submitLogin: isEn ? "Sign In to Workspace" : isId ? "Masuk ke Konsol" : "登录进入工作台",
      submitRegister: isEn
        ? "Create Account & Start Onboarding"
        : isId
        ? "Daftar & Mulai Panduan"
        : "立即注册并进入入驻向导",
      verifying: isEn ? "Verifying identity..." : isId ? "Memverifikasi identitas..." : "身份核验中...",
      creatingAccount: isEn ? "Creating account..." : isId ? "Membuat akun..." : "创建账号中...",
      noAccountText: isEn ? "Don't have an account?" : isId ? "Belum punya akun?" : "还没有商户账号？",
      registerFreeCta: isEn ? "Register free (+100 Credits)" : isId ? "Daftar gratis (+100 Kredit)" : "免费注册（送 100 Credits）",
      hasAccountText: isEn ? "Already have an account?" : isId ? "Sudah punya akun?" : "已有商户账号？",
      loginDirectCta: isEn ? "Sign in directly" : isId ? "Langsung masuk" : "直接登录",
      termsAgreeText: isEn
        ? "I have read and agree to SolaFlow Merchant Agreement, Privacy Policy, and Meta BAA."
        : isId
        ? "Saya telah membaca dan menyetujui Ketentuan Merchant SolaFlow, Kebijakan Privasi, dan Perjanjian Meta BAA."
        : "我已阅读并同意 SolaFlow 出海服务协议、隐私条款及 Meta 商业数据处理附约",
      securityGuarantee: isEn
        ? "Meta BAA Compliant Direct Link · End-to-End Encrypted"
        : isId
        ? "Kepatuhan Meta BAA · Terenkripsi Ujung ke Ujung"
        : "Meta BAA 合规直连 · 端到端安全加密",
      termsFooter: isEn
        ? "By continuing, you agree to SolaFlow Merchant Terms and Meta BAA Data Agreement."
        : isId
        ? "Dengan melanjutkan, Anda menyetujui Ketentuan Merchant SolaFlow dan Perjanjian Meta BAA."
        : "登录或注册即代表您同意 SolaFlow 出海商户服务协议与 Meta 商业数据处理附约 (BAA)",

      // 错误与反馈提示
      errInvalidEmail: isEn ? "Please enter a valid work email address." : isId ? "Silakan masukkan alamat email bisnis yang valid." : "请输入有效的商家工作邮箱地址。",
      errOtpIncomplete: isEn ? "Please enter all 6 digits of the OTP code." : isId ? "Masukkan 6 digit kode OTP lengkap." : "请输入完整的 6 位动态验证码。",
      errPasswordMin6: isEn ? "Password must be at least 6 characters." : isId ? "Kata sandi minimal 6 karakter." : "密码长度不能少于 6 位。",
      errPasswordMin8: isEn ? "Password must be at least 8 characters long." : isId ? "Kata sandi minimal 8 karakter demi keamanan." : "为了您的商户资金安全，密码长度不能少于 8 位。",
      errStoreNameEmpty: isEn ? "Please enter your store or business name." : isId ? "Silakan masukkan nama toko atau bisnis Anda." : "请输入您的店铺或商户名称。",
      errPasswordMismatch: isEn ? "Passwords do not match." : isId ? "Konfirmasi kata sandi tidak cocok." : "两次输入的密码不一致，请重新核对。",
      errMustAgreeTerms: isEn ? "You must agree to the merchant terms." : isId ? "Anda harus menyetujui ketentuan merchant." : "请勾选同意出海商户服务条款与 Meta 协议。",
      errLoginFailed: isEn ? "Authentication failed, please try again." : isId ? "Verifikasi gagal, silakan coba lagi." : "登录核验失败，请重试",
      msgAuthSuccess: isEn ? "Authenticated successfully! Redirecting to workspace..." : isId ? "Autentikasi berhasil! Mengalihkan ke konsol..." : "身份核验通过，正在跳转至工作台...",
      msgRegisterSuccess: isEn
        ? "Account created! 100 trial credits issued. Redirecting to onboarding..."
        : isId
        ? "Akun berhasil dibuat! Bonus 100 kredit aktif. Menuju panduan..."
        : "商户账号注册成功！已发放 100 Credits 试用额度，正在进入 6 步入驻向导...",
      msgOtpSentReal: (em: string) =>
        isEn ? `Verification code sent to ${em}.` : isId ? `Kode verifikasi dikirim ke ${em}.` : `动态验证码已发送至 ${em}。`,
    }),
    [isEn, isId]
  );

  const marketOptions = [
    {
      value: "id_ID",
      label: isEn
        ? "Indonesia (ID · +62 COD / Recovery focus)"
        : isId
        ? "Indonesia (ID · +62 COD & Pemulihan)"
        : "印度尼西亚 (Indonesia · +62 COD / 催付重点)",
    },
    {
      value: "th_TH",
      label: isEn
        ? "Thailand (TH · +66)"
        : isId
        ? "Thailand (TH · +66)"
        : "泰国 (Thailand · +66)",
    },
    {
      value: "en_SG",
      label: isEn
        ? "Singapore / SEA English (SG · +65)"
        : isId
        ? "Singapura / Bahasa Inggris (SG · +65)"
        : "新加坡 / 东南亚英文区 (Singapore · +65)",
    },
    {
      value: "ms_MY",
      label: isEn
        ? "Malaysia (MY · +60)"
        : isId
        ? "Malaysia (MY · +60)"
        : "马来西亚 (Malaysia · +60)",
    },
    {
      value: "vi_VN",
      label: isEn
        ? "Vietnam (VN · +84)"
        : isId
        ? "Vietnam (VN · +84)"
        : "越南 (Vietnam · +84)",
    },
    {
      value: "fil_PH",
      label: isEn
        ? "Philippines (PH · +63)"
        : isId
        ? "Filipina (PH · +63)"
        : "菲律宾 (Philippines · +63)",
    },
  ];

  // 持久化记住邮箱
  const persistRememberedEmail = useCallback(
    (targetEmail: string) => {
      try {
        if (rememberEmail && targetEmail) {
          localStorage.setItem(STORAGE_EMAIL_KEY, targetEmail.trim());
        } else {
          localStorage.removeItem(STORAGE_EMAIL_KEY);
        }
      } catch {
        // 容错
      }
    },
    [rememberEmail]
  );

  // Establish the repository session from the identity Neon Auth already verified.
  const establishSession = useCallback(async () => {
    await authApi.establishNeonSession(locale);
  }, [locale]);

  // 执行 OTP 登录核验（供手动提交和 6 位自动提交复用）
  const executeOtpVerification = useCallback(
    async (codeToVerify: string) => {
      if (isAutoSubmittingRef.current || loading) return;
      isAutoSubmittingRef.current = true;
      setErrorMsg(null);

      if (!validateEmail(email)) {
        setErrorMsg(t.errInvalidEmail);
        isAutoSubmittingRef.current = false;
        return;
      }

      setLoading(true);
      persistRememberedEmail(email);

      try {
        const { error } = await authClient.signIn.emailOtp({ email, otp: codeToVerify });
        if (error) throw new Error(error.message || t.errLoginFailed);
        await establishSession();
        setSuccessMsg(t.msgAuthSuccess);
        setTimeout(() => {
          router.push("/console");
        }, 400);
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : t.errLoginFailed);
      } finally {
        setLoading(false);
        isAutoSubmittingRef.current = false;
      }
    },
    [email, loading, router, persistRememberedEmail, t, establishSession]
  );

  // 发送验证码（交接给 Neon Auth 托管投递）
  const handleSendOtp = async () => {
    setErrorMsg(null);
    if (!validateEmail(email)) {
      setErrorMsg(t.errInvalidEmail);
      return;
    }

    setLoading(true);
    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" });
      if (error) throw new Error(error.message || t.errLoginFailed);
      setOtpSent(true);
      setCountdown(60);
      setSuccessMsg(t.msgOtpSentReal(email));
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : t.errLoginFailed);
    } finally {
      setLoading(false);
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    }
  };

  // 处理 6 位 OTP 输入（带 6 位填满自动提交）
  const handleOtpChange = (index: number, val: string) => {
    setErrorMsg(null);
    const cleaned = val.replace(/\D/g, "");
    if (!cleaned) {
      const next = [...otpCode];
      next[index] = "";
      setOtpCode(next);
      return;
    }

    const next = [...otpCode];
    next[index] = cleaned.slice(-1);
    setOtpCode(next);

    if (index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }

    // 若已经填满全部 6 位，自动触发提交
    if (isOtpComplete(next)) {
      executeOtpVerification(next.join(""));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otpCode[index] && index > 0) {
        otpInputsRef.current[index - 1]?.focus();
      }
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text");
    const sanitized = sanitizeOtpPaste(pasteData);
    setOtpCode(sanitized);

    const nonBlankCount = sanitized.filter(Boolean).length;
    const focusIdx = Math.min(Math.max(nonBlankCount, 1) - 1, 5);
    otpInputsRef.current[focusIdx]?.focus();

    // 若完整粘贴了 6 位纯数字，直接触发自动验证
    if (isOtpComplete(sanitized)) {
      executeOtpVerification(sanitized.join(""));
    }
  };

  const handleSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!validateEmail(email)) {
      setErrorMsg(t.errInvalidEmail);
      return;
    }

    if (loginMethod === "otp") {
      if (!isOtpComplete(otpCode)) {
        setErrorMsg(t.errOtpIncomplete);
        return;
      }
      executeOtpVerification(otpCode.join(""));
    } else {
      if (!password || password.length < 6) {
        setErrorMsg(t.errPasswordMin6);
        return;
      }

      setLoading(true);
      persistRememberedEmail(email);

      try {
        const { error } = await authClient.signIn.email({ email, password });
        if (error) throw new Error(error.message || t.errLoginFailed);
        await establishSession();
        setSuccessMsg(t.msgAuthSuccess);
        setTimeout(() => {
          router.push("/console");
        }, 400);
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : t.errLoginFailed);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmitRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!validateEmail(email)) {
      setErrorMsg(t.errInvalidEmail);
      return;
    }
    if (!storeName.trim()) {
      setErrorMsg(t.errStoreNameEmpty);
      return;
    }
    if (!password || password.length < 8) {
      setErrorMsg(t.errPasswordMin8);
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg(t.errPasswordMismatch);
      return;
    }
    if (!agreedTerms) {
      setErrorMsg(t.errMustAgreeTerms);
      return;
    }

    setLoading(true);
    persistRememberedEmail(email);

    try {
      const { error } = await authClient.signUp.email({ email, password, name: storeName.trim() });
      if (error) throw new Error(error.message || t.errLoginFailed);
      await establishSession();
      setSuccessMsg(t.msgRegisterSuccess);
      setTimeout(() => {
        router.push("/onboarding");
      }, 700);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : t.errLoginFailed);
    } finally {
      setLoading(false);
    }
  };

  const strength = calculatePasswordStrength(password);

  return (
    <div className="w-full max-w-[440px] mx-auto font-sans">
      {/* 质感认证卡片容器 (高定极简微圆角与柔和阴影，居中聚焦) */}
      <div className="border border-zinc-200/80 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_12px_36px_rgb(0,0,0,0.05)] p-4 sm:p-6 space-y-3 sm:space-y-4 relative transition-all">
        {/* 顶部标语 */}
        <div className="space-y-1.5">

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 font-sans">
            {mode === "login" ? t.titleLogin : t.titleRegister}
          </h1>
          <p className="text-xs text-zinc-500 leading-relaxed font-sans">
            {mode === "login" ? t.descLogin : t.descRegister}
          </p>
        </div>

        {/* 模式切换胶囊 (登录 / 注册) - 带 Motion 灵动滑块 */}
        <div className="grid grid-cols-2 p-0.5 sm:p-1 bg-zinc-100/80 border border-zinc-200/60 rounded-xl text-xs relative">
          <button
            type="button"
            onClick={() => handleModeSwitch("login")}
            className={clsx(
              "relative py-1 sm:py-1.5 font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors z-10",
              mode === "login" ? "text-zinc-950 font-semibold" : "text-zinc-500 hover:text-zinc-900"
            )}
          >
            {mode === "login" && (
              <motion.div
                layoutId="auth-tab-pill"
                className="absolute inset-0 bg-white rounded-lg shadow-xs border border-zinc-200/60"
                transition={{ type: "spring", bounce: 0.15, duration: 0.3 }}
              />
            )}
            <span className="relative z-10">{t.tabLogin}</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch("register")}
            className={clsx(
              "relative py-1 sm:py-1.5 font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors z-10",
              mode === "register" ? "text-zinc-950 font-semibold" : "text-zinc-500 hover:text-zinc-900"
            )}
          >
            {mode === "register" && (
              <motion.div
                layoutId="auth-tab-pill"
                className="absolute inset-0 bg-white rounded-lg shadow-xs border border-zinc-200/60"
                transition={{ type: "spring", bounce: 0.15, duration: 0.3 }}
              />
            )}
            <span className="relative z-10">{t.tabRegister}</span>
            <span className="relative z-10 text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-mono font-medium">
              +100
            </span>
          </button>
        </div>

        {/* 状态消息横条 (带微动效) */}
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div
              key="error-box"
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="p-2 sm:p-2.5 bg-rose-50/80 border border-rose-200/80 rounded-xl text-rose-900 text-xs flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1 leading-snug">{errorMsg}</div>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              key="success-box"
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="p-2 sm:p-2.5 bg-emerald-50/80 border border-emerald-200/80 rounded-xl text-emerald-900 text-xs flex items-start gap-2"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <div className="flex-1 leading-snug">{successMsg}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 主体表单区 (利用 AnimatePresence 实现平滑无缝模式切换) */}
        <AnimatePresence mode="wait">
          {mode === "login" ? (
            <motion.form
              key="login-form"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSubmitLogin}
              className="space-y-2.5 sm:space-y-3 text-xs"
            >
              {/* 子方式切换 (OTP / 密码) - 带 Motion 下划线滑块 */}
              <div className="flex items-center justify-between border-b border-zinc-100 pb-1 sm:pb-1.5 text-[11px]">
                <div className="flex items-center gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setLoginMethod("otp")}
                    className={clsx(
                      "cursor-pointer pb-0.5 sm:pb-1 transition-colors font-medium relative",
                      loginMethod === "otp"
                        ? "text-zinc-900 font-semibold"
                        : "text-zinc-400 hover:text-zinc-700"
                    )}
                  >
                    <span>{t.methodOtp}</span>
                    {loginMethod === "otp" && (
                      <motion.div
                        layoutId="login-method-line"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 rounded-full"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.3 }}
                      />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMethod("password")}
                    className={clsx(
                      "cursor-pointer pb-0.5 sm:pb-1 transition-colors font-medium relative",
                      loginMethod === "password"
                        ? "text-zinc-900 font-semibold"
                        : "text-zinc-400 hover:text-zinc-700"
                    )}
                  >
                    <span>{t.methodPassword}</span>
                    {loginMethod === "password" && (
                      <motion.div
                        layoutId="login-method-line"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 rounded-full"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.3 }}
                      />
                    )}
                  </button>
                </div>

                {loginMethod === "otp" && otpSent && (
                  <span className="text-[10px] text-emerald-700 flex items-center gap-1 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    {t.otpSentBadge}
                  </span>
                )}
              </div>

              {/* 邮箱输入框 */}
              <div>
                <label className="text-zinc-500 uppercase text-[9px] sm:text-[10px] tracking-wider block mb-1">
                  {t.emailLabel}
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-2.5 sm:top-3 text-zinc-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.emailPlaceholder}
                    className="w-full pl-8 sm:pl-9 pr-20 sm:pr-24 py-1.5 sm:py-2 rounded-lg bg-zinc-50/60 hover:bg-white focus:bg-white border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-400 text-xs font-mono transition-all text-zinc-900 placeholder:text-zinc-400"
                    required
                  />
                  {loginMethod === "otp" && (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={countdown > 0}
                      className="absolute right-1 top-1 sm:right-1.5 sm:top-1.5 px-2 py-0.5 sm:py-1 text-[10px] rounded-md border border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
                    >
                      {countdown > 0 ? `${countdown}s` : otpSent ? t.resendOtpBtn : t.sendOtpBtn}
                    </button>
                  )}
                </div>
              </div>

              {/* OTP 模式：6 位精密验证码输入 (支持自动提交) */}
              {loginMethod === "otp" && otpSent && (
                <div className="space-y-1.5 pt-0.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <label className="text-zinc-500 uppercase tracking-wider">
                      {t.otpHint}
                    </label>
                    <span className="text-emerald-700 font-medium">
                      {t.autoSubmitHint}
                    </span>
                  </div>
                  <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
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
                        className={clsx(
                          "h-10 sm:h-11 text-center font-mono font-bold text-base sm:text-lg rounded-lg border transition-all selection:bg-zinc-900 selection:text-white",
                          digit
                            ? "border-zinc-800 bg-white text-zinc-900 ring-1 ring-zinc-900/10 shadow-xs"
                            : "border-zinc-200 bg-zinc-50/60 focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-900/5 text-zinc-900"
                        )}
                        aria-label={`OTP 验证码第 ${i + 1} 位`}
                      />
                    ))}
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-zinc-400 text-right">
                    {t.otpPasteHint}
                  </div>
                </div>
              )}

              {/* 密码模式：密码输入框 */}
              {loginMethod === "password" && (
                <div className="space-y-1">
                  <label className="text-zinc-500 uppercase text-[9px] sm:text-[10px] tracking-wider block">
                    {t.passwordLabel}
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 absolute left-3 top-2.5 sm:top-3 text-zinc-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-8 sm:pl-9 pr-8 sm:pr-9 py-1.5 sm:py-2 rounded-lg bg-zinc-50/60 hover:bg-white focus:bg-white border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-400 text-xs font-mono transition-all text-zinc-900 placeholder:text-zinc-400"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2 sm:top-2.5 text-zinc-400 hover:text-zinc-700 cursor-pointer"
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

              {/* 记住邮箱与忘记密码同行展示 */}
              <div className="flex items-center justify-between pt-0.5 text-[11px]">
                <label className="flex items-center gap-1.5 cursor-pointer select-none text-zinc-500 hover:text-zinc-800">
                  <input
                    type="checkbox"
                    checked={rememberEmail}
                    onChange={(e) => setRememberEmail(e.target.checked)}
                    className="rounded-sm border-zinc-300 text-zinc-900 focus:ring-0 cursor-pointer"
                  />
                  <span className="text-[10px] sm:text-[11px]">{t.rememberEmail}</span>
                </label>

                {loginMethod === "password" && (
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMethod("otp");
                      handleSendOtp();
                    }}
                    className="text-[10px] sm:text-[11px] text-zinc-500 hover:text-zinc-900 underline cursor-pointer"
                  >
                    {t.forgotPassword}
                  </button>
                )}
              </div>

              {/* 登录主行动按钮 (现代温润深色与微圆角) */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-10 sm:h-10.5 text-xs font-semibold tracking-wide bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg cursor-pointer mt-1 sm:mt-1.5 shadow-xs transition-all active:scale-[0.99]"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    {t.verifying}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1.5 font-semibold">
                    {t.submitLogin}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                )}
              </Button>

              {/* 第三方 OAuth 登录 */}
              <OAuthButtons onError={(err) => setErrorMsg(err)} />

              {/* 切换到注册 */}
              <div className="text-center pt-0.5 text-[10px] sm:text-[11px] text-zinc-500">
                {t.noAccountText}{" "}
                <button
                  type="button"
                  onClick={() => handleModeSwitch("register")}
                  className="text-zinc-900 font-semibold underline hover:text-zinc-700 cursor-pointer"
                >
                  {t.registerFreeCta}
                </button>
              </div>
            </motion.form>
          ) : (
            <motion.form
              key="register-form"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSubmitRegister}
              className="space-y-2 sm:space-y-2.5 text-xs"
            >
              {/* 工作邮箱 */}
              <div>
                <label className="text-zinc-500 uppercase text-[9px] sm:text-[10px] tracking-wider block mb-1">
                  {t.emailLabel} *
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-2.5 sm:top-3 text-zinc-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.emailPlaceholder}
                    className="w-full pl-8 sm:pl-9 pr-3 py-1.5 sm:py-2 rounded-lg bg-zinc-50/60 hover:bg-white focus:bg-white border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-400 text-xs font-mono transition-all text-zinc-900 placeholder:text-zinc-400"
                    required
                  />
                </div>
              </div>

              {/* 店铺名称与首发市场 (双列栅格紧凑排布) */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-500 uppercase text-[9px] sm:text-[10px] tracking-wider block mb-1 truncate">
                    {t.storeNameLabel} *
                  </label>
                  <div className="relative">
                    <Store className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-400" />
                    <input
                      type="text"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder={t.storeNamePlaceholder}
                      className="w-full pl-7 sm:pl-8 pr-2 py-1.5 sm:py-2 rounded-lg bg-zinc-50/60 hover:bg-white focus:bg-white border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-400 text-xs font-mono transition-all text-zinc-900 placeholder:text-zinc-400"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-zinc-500 uppercase text-[9px] sm:text-[10px] tracking-wider block mb-1 truncate">
                    {t.marketLabel}
                  </label>
                  <div className="relative">
                    <Globe className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-400" />
                    <select
                      value={targetMarket}
                      onChange={(e) => setTargetMarket(e.target.value)}
                      className="w-full pl-7 sm:pl-8 pr-1 py-1.5 sm:py-2 rounded-lg bg-zinc-50/60 hover:bg-white focus:bg-white border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-400 text-xs font-mono appearance-none cursor-pointer transition-all text-zinc-900 truncate"
                    >
                      {marketOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 设置密码与确认密码 (双列栅格紧凑排布) */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-zinc-500 uppercase text-[9px] sm:text-[10px] tracking-wider block truncate">
                      {t.passwordLabel} *
                    </label>
                    {password.length > 0 && (
                      <span
                        className={clsx(
                          "text-[9px] font-bold shrink-0",
                          strength.level === "weak"
                            ? "text-rose-600"
                            : strength.level === "medium"
                            ? "text-amber-600"
                            : "text-emerald-600"
                        )}
                      >
                        {isEn ? strength.labelEn : isId ? strength.labelId : strength.labelZh}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-7 sm:pl-8 pr-7 py-1.5 sm:py-2 rounded-lg bg-zinc-50/60 hover:bg-white focus:bg-white border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-400 text-xs font-mono transition-all text-zinc-900 placeholder:text-zinc-400"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-2 text-zinc-400 hover:text-zinc-700 cursor-pointer"
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

                <div>
                  <label className="text-zinc-500 uppercase text-[9px] sm:text-[10px] tracking-wider block mb-1 truncate">
                    {t.confirmPasswordLabel} *
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-7 sm:pl-8 pr-2 py-1.5 sm:py-2 rounded-lg bg-zinc-50/60 hover:bg-white focus:bg-white border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-400 text-xs font-mono transition-all text-zinc-900 placeholder:text-zinc-400"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* 三段式发丝密码强度槽 */}
              {password.length > 0 && (
                <div className="grid grid-cols-3 gap-1 pt-0.5">
                  <div
                    className={clsx(
                      "h-0.5 sm:h-1 rounded-full transition-colors",
                      strength.level === "weak" || strength.level === "medium" || strength.level === "strong"
                        ? strength.level === "weak"
                          ? "bg-rose-500"
                          : strength.level === "medium"
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                        : "bg-zinc-100"
                    )}
                  />
                  <div
                    className={clsx(
                      "h-0.5 sm:h-1 rounded-full transition-colors",
                      strength.level === "medium" || strength.level === "strong"
                        ? strength.level === "medium"
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                        : "bg-zinc-100"
                    )}
                  />
                  <div
                    className={clsx(
                      "h-0.5 sm:h-1 rounded-full transition-colors",
                      strength.level === "strong" ? "bg-emerald-500" : "bg-zinc-100"
                    )}
                  />
                </div>
              )}

              {/* 同意协议 */}
              <div className="pt-0.5">
                <label className="flex items-start gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                    className="mt-0.5 rounded-sm border-zinc-300 text-zinc-900 focus:ring-0 cursor-pointer"
                  />
                  <span className="text-[9px] sm:text-[10px] text-zinc-500 leading-tight">
                    {t.termsAgreeText}
                  </span>
                </label>
              </div>

              {/* 注册提交按钮 */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-10 sm:h-10.5 text-xs font-semibold tracking-wide bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg cursor-pointer mt-1 sm:mt-1.5 shadow-xs transition-all active:scale-[0.99]"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    {t.creatingAccount}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1.5 font-semibold">
                    {t.submitRegister}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                )}
              </Button>

              {/* 第三方 OAuth 快捷注册 */}
              <OAuthButtons onError={(err) => setErrorMsg(err)} />

              {/* 切换到登录 */}
              <div className="text-center pt-0.5 text-[10px] sm:text-[11px] text-zinc-500">
                {t.hasAccountText}{" "}
                <button
                  type="button"
                  onClick={() => handleModeSwitch("login")}
                  className="text-zinc-900 font-semibold underline hover:text-zinc-700 cursor-pointer"
                >
                  {t.loginDirectCta}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* 底部保障与声明 */}
        <div className="pt-2 sm:pt-2.5 border-t border-zinc-100 space-y-1 text-[9px] sm:text-[10px] text-zinc-400 text-center">
          <div className="flex items-center justify-center gap-1.5 text-zinc-600">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{t.securityGuarantee}</span>
          </div>
          <p className="leading-tight line-clamp-1 sm:line-clamp-none">{t.termsFooter}</p>
        </div>
      </div>
    </div>
  );
}
