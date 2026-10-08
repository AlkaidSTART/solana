import { describe, it, expect } from "vitest";
import {
  validateEmail,
  calculatePasswordStrength,
  sanitizeOtpPaste,
  isOtpComplete,
} from "./auth-utils";

describe("auth-utils - 商户登录注册表单核心校验与密码评估", () => {
  describe("validateEmail 邮箱格式核验", () => {
    it("正常出海工作邮箱应通过", () => {
      expect(validateEmail("merchant@crossborder-shop.com")).toBe(true);
      expect(validateEmail("owner@toko-sepatu.co.id")).toBe(true);
      expect(validateEmail("sea.seller@subdomain.store.com")).toBe(true);
    });

    it("空值或非法邮箱格式应被拒绝", () => {
      expect(validateEmail("")).toBe(false);
      expect(validateEmail("invalid-email")).toBe(false);
      expect(validateEmail("merchant@")).toBe(false);
      expect(validateEmail("@crossborder.com")).toBe(false);
      expect(validateEmail("merchant@shop")).toBe(false);
    });
  });

  describe("calculatePasswordStrength 密码强度评估", () => {
    it("空密码应判定为 weak 且分数为 0", () => {
      const res = calculatePasswordStrength("");
      expect(res.level).toBe("weak");
      expect(res.score).toBe(0);
    });

    it("小于 8 位的短密码应判定为 weak", () => {
      const res = calculatePasswordStrength("1234567");
      expect(res.level).toBe("weak");
    });

    it("8 位以上普通组合判定为 medium", () => {
      const res = calculatePasswordStrength("pass123456");
      expect(res.level).toBe("medium");
    });

    it("12 位以上包含大写、数字及符号判定为 strong", () => {
      const res = calculatePasswordStrength("SolaFlow2026!Secure");
      expect(res.level).toBe("strong");
      expect(res.score).toBeGreaterThanOrEqual(80);
    });
  });

  describe("sanitizeOtpPaste 剪贴板 OTP 粘贴解析", () => {
    it("能从标准 6 位数字中正确解析", () => {
      expect(sanitizeOtpPaste("892104")).toEqual(["8", "9", "2", "1", "0", "4"]);
    });

    it("能剔除破折号、空格和多余文本并精准截取 6 位", () => {
      expect(sanitizeOtpPaste("OTP-892-104")).toEqual(["8", "9", "2", "1", "0", "4"]);
      expect(sanitizeOtpPaste("Your verification code is 892 104 today")).toEqual([
        "8",
        "9",
        "2",
        "1",
        "0",
        "4",
      ]);
    });

    it("不足 6 位时后置补空字符串", () => {
      expect(sanitizeOtpPaste("123")).toEqual(["1", "2", "3", "", "", ""]);
    });

    it("超过 6 位时仅截取前 6 位", () => {
      expect(sanitizeOtpPaste("123456789")).toEqual(["1", "2", "3", "4", "5", "6"]);
    });
  });

  describe("isOtpComplete 完整性校验", () => {
    it("6 位纯数字有效输入应返回 true", () => {
      expect(isOtpComplete(["8", "9", "2", "1", "0", "4"])).toBe(true);
    });

    it("存在未填空位时返回 false", () => {
      expect(isOtpComplete(["8", "9", "2", "", "", ""])).toBe(false);
      expect(isOtpComplete(["8", "9", "2", "1", "0", ""])).toBe(false);
    });

    it("包含非数字字符时返回 false", () => {
      expect(isOtpComplete(["8", "9", "a", "1", "0", "4"])).toBe(false);
    });
  });
});
