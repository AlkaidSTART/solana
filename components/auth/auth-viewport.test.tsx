import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AuthCard } from "./auth-card";
import { AuthShowcase } from "./auth-showcase";
import { OAuthButtons } from "./oauth-buttons";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("Login Viewport & Non-Overflow Structure Tests", () => {
  describe("AuthCard Compact Viewport Layout", () => {
    it("renders login card with compact max-width, reduced padding and responsive spacing", () => {
      const html = renderToStaticMarkup(<AuthCard initialMode="login" />);

      // 外层最大宽度收敛为 440px，内边距为紧凑的 p-4 sm:p-6 与 space-y-3 sm:space-y-4
      expect(html).toContain("max-w-[440px]");
      expect(html).toContain("p-4 sm:p-6");
      expect(html).toContain("space-y-3 sm:space-y-4");

      // 验证邮箱输入与主按钮高度紧凑 (h-10 sm:h-10.5)
      expect(html).toContain("merchant@crossborder-shop.com");
      expect(html).toContain("h-10 sm:h-10.5");

      // 验证记住邮箱与找回密码同排结构
      expect(html).toContain("在此浏览器记住工作邮箱");
    });

    it("renders register card with 2-column compact grid for paired fields", () => {
      const html = renderToStaticMarkup(<AuthCard initialMode="register" />);

      // 注册表单采用双列栅格 grid-cols-2
      expect(html).toContain("grid grid-cols-2 gap-2");

      // 包含店铺名称、首发市场、密码与确认密码
      expect(html).toContain("店铺或品牌名称");
      expect(html).toContain("主营出海市场");
      expect(html).toContain("确认登录密码");
      expect(html).toContain("h-10 sm:h-10.5");
    });
  });

  describe("AuthShowcase Viewport Elasticity", () => {
    it("renders showcase with min-h-0 and no hardcoded min-h-[640px]", () => {
      const html = renderToStaticMarkup(<AuthShowcase />);

      // 解除硬编码 640px 最小高度，保证小高度屏幕不产生页面级滚动
      expect(html).not.toContain("min-h-[640px]");
      expect(html).toContain("min-h-0");

      // 响应式内边距与垂直伸缩间距
      expect(html).toContain("p-4 lg:p-5 xl:p-8");
      expect(html).toContain("my-auto py-1 xl:py-2");

      // 4 列商业指标紧凑栅格
      expect(html).toContain("grid grid-cols-4 gap-1.5 xl:gap-2");
      expect(html).toContain("+18.4%");
      expect(html).toContain("-6.2%");
    });
  });

  describe("OAuthButtons Compact Structure", () => {
    it("renders social login buttons with compact height and margins", () => {
      const html = renderToStaticMarkup(<OAuthButtons />);

      expect(html).toContain("h-8.5 sm:h-9");
      expect(html).toContain("space-y-2");
      expect(html).toContain("Google");
    });
  });
});
