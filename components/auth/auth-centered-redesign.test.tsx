import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import LoginPage from "@/app/login/page";
import RegisterPage from "@/app/register/page";
import { AuthCard } from "./auth-card";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("Login & Register Minimalist Centered Redesign Tests", () => {
  describe("LoginPage Centered Architecture", () => {
    it("renders centered layout without AuthShowcase and with enterprise trust signals", () => {
      const html = renderToStaticMarkup(<LoginPage />);

      // 验证彻底去除了 AuthShowcase 相关对话气泡与营销卡片
      expect(html).not.toContain("SolaFlow Order Concierge");
      expect(html).not.toContain("Air Obsidian 42");
      expect(html).not.toContain("15分钟温和催付");
      expect(html).not.toContain("COD 发货前核验");
      expect(html).not.toContain("待支付弃购挽回率");

      // 验证居中聚焦容器与卡片容器
      expect(html).toContain("max-w-[440px]");
      expect(html).toContain("h-dvh max-h-dvh overflow-hidden");

      // 验证顶部微导航与运行指示灯
      expect(html).toContain("SolaFlow");
      expect(html).toContain("AI");
      expect(html).toContain("META BAA 官方直连 · 99.99% 运行正常");

      // 验证底部企业合规与东南亚低延迟边缘节点
      expect(html).toContain("Meta BAA 商业数据合规");
      expect(html).toContain("Solana Pay USDC 即时结算");
      expect(html).toContain("256-bit 端到端安全加密");
      expect(html).toContain("CGK · 8ms");
      expect(html).toContain("BKK · 14ms");
      expect(html).toContain("SIN · 2ms");
    });
  });

  describe("RegisterPage Centered Architecture", () => {
    it("renders register page with matching centered design and register mode", () => {
      const html = renderToStaticMarkup(<RegisterPage />);

      // 无展示组件残留
      expect(html).not.toContain("SolaFlow Order Concierge");

      // 初始渲染为注册模式表单
      expect(html).toContain("开通商户账号");
      expect(html).toContain("店铺或品牌名称");
      expect(html).toContain("主营出海市场");
      expect(html).toContain("确认登录密码");

      // 验证居中与合规信息
      expect(html).toContain("max-w-[440px]");
      expect(html).toContain("Meta BAA 商业数据合规");
    });
  });

  describe("AuthCard Interaction & Density", () => {
    it("renders high-conversion inputs and WCAG accessible action buttons", () => {
      const html = renderToStaticMarkup(<AuthCard initialMode="login" />);

      // 验证去除微徽章，卡片顶部不再展示“商户安全工作台”与绿色指示灯
      expect(html).not.toContain("// V1.1");
      expect(html).not.toContain("商户安全工作台");
      expect(html).not.toContain("ENTERPRISE CONSOLE");

      expect(html).toContain("商户登录");
      expect(html).toContain("h-10 sm:h-10.5");
      expect(html).toContain("Google");
      expect(html).toContain("登录进入工作台");
    });
  });

  describe("Clean Focused Auth Interface", () => {
    it("renders clean focused layout without distracting bouncing characters", () => {
      const html = renderToStaticMarkup(<LoginPage />);

      // 验证无跳动字符装饰，保持纯粹专注
      expect(html).not.toContain("COMMERCE RUNTIME");
      expect(html).not.toContain("AUTONOMOUS CONCIERGE");
      expect(html).not.toContain("KINETIC SYSTEM");

      // 验证页面底背书正常
      expect(html).toContain("Meta BAA 商业数据合规");

      const cardHtml = renderToStaticMarkup(<AuthCard initialMode="login" />);
      expect(cardHtml).not.toContain("商户安全工作台");
      expect(cardHtml).not.toContain("// V1.1");
    });
  });
});
