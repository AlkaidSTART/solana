import { describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { UserAssetsBanner } from "./user-assets-banner";
import { useAppStore } from "@/stores/use-app-store";
import { MOCK_USER_PROFILE, MOCK_CREDITS } from "@/mock";

describe("UserAssetsBanner Component", () => {
  beforeEach(() => {
    useAppStore.setState({
      locale: "zh_CN",
      userProfile: { ...MOCK_USER_PROFILE },
      credits: { ...MOCK_CREDITS },
    });
  });

  it("renders merchant user profile (name, role, email) and digital assets (Credits, SOL, USDC)", () => {
    const html = renderToStaticMarkup(
      <UserAssetsBanner
        sessionEmail="alex.merchant@solaflow.ai"
        tenantName="SEA_8892 Store Hub"
      />
    );

    // 验证主理人姓名
    expect(html).toContain("Alex Rivera");
    // 验证角色徽章
    expect(html).toContain("Owner");
    // 验证认证邮箱
    expect(html).toContain("alex.merchant@solaflow.ai");
    // 验证 Credits 资产
    expect(html).toContain("8,420");
    // 验证 Solana Devnet 钱包资产
    expect(html).toContain("2.450 SOL");
    expect(html).toContain("350.00 USDC");
    // 验证默认头像采用 lucide-react 的 User 图标
    expect(html).toContain("lucide-user");
    expect(html).not.toContain("AR");
    // 验证 GMV 挽回资产
    expect(html).toContain("$14,250");
  });
});
