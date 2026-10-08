/**
 * 商户认证表单纯逻辑与校验规则 (Swiss Minimalist Auth Utils)
 */

export type PasswordStrengthLevel = "weak" | "medium" | "strong";

export interface PasswordStrengthResult {
  level: PasswordStrengthLevel;
  labelZh: string;
  labelEn: string;
  score: number; // 0-100
}

/**
 * 校验邮箱格式
 */
export function validateEmail(email: string): boolean {
  if (!email) return false;
  const trimmed = email.trim();
  // 基础邮箱格式
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(trimmed);
}

/**
 * 计算密码强度
 */
export function calculatePasswordStrength(password: string): PasswordStrengthResult {
  if (!password || password.length === 0) {
    return { level: "weak", labelZh: "未填写", labelEn: "Empty", score: 0 };
  }

  let score = 0;
  if (password.length >= 8) score += 30;
  if (password.length >= 12) score += 20;
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 15;
  if (/[0-9]/.test(password)) score += 15;
  if (/[^A-Za-z0-9]/.test(password)) score += 15;

  if (password.length < 8) {
    return { level: "weak", labelZh: "弱 (需8位以上)", labelEn: "Weak (<8 chars)", score };
  }
  if (score < 70) {
    return { level: "medium", labelZh: "中等", labelEn: "Medium", score };
  }
  return { level: "strong", labelZh: "高强度", labelEn: "Strong", score };
}

/**
 * 处理剪贴板粘贴的 OTP 验证码字符，提取前 6 位纯数字
 */
export function sanitizeOtpPaste(raw: string): string[] {
  const digits = raw.replace(/\D/g, "").slice(0, 6);
  const result: string[] = ["", "", "", "", "", ""];
  for (let i = 0; i < digits.length; i++) {
    result[i] = digits[i];
  }
  return result;
}

/**
 * 验证 OTP 数组是否完整有效（必须 6 位纯数字）
 */
export function isOtpComplete(otpArray: string[]): boolean {
  if (!Array.isArray(otpArray) || otpArray.length !== 6) return false;
  return otpArray.every((digit) => digit.length === 1 && /^\d$/.test(digit));
}
