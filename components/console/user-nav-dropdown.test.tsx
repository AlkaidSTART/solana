import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { UserNavDropdown } from "./user-nav-dropdown";
import { useAppStore } from "@/stores/use-app-store";
import { MOCK_USER_PROFILE, MOCK_CREDITS } from "@/mock";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("UserNavDropdown Component", () => {
  beforeEach(() => {
    useAppStore.setState({
      locale: "zh_CN",
      userProfile: { ...MOCK_USER_PROFILE },
      credits: { ...MOCK_CREDITS },
    });
  });

  it("renders trigger button with user default icon, name and role badge", () => {
    const html = renderToStaticMarkup(
      <UserNavDropdown
        sessionEmail="owner@example.com"
        tenantName="SEA_8892 Store Hub"
      />
    );

    // 包含触发按钮
    expect(html).toContain("button");
    // 包含来自 lucide-react 的 User 矢量图标，不含手绘首字母 "AR"
    expect(html).toContain("lucide-user");
    expect(html).not.toContain("AR");
    // 包含用户名
    expect(html).toContain("Alex Rivera");
    // 包含角色
    expect(html).toContain("Owner");
    // 包含 Demo 标识
    expect(html).toContain("演示模式");
  });

  it("falls back to userProfile email when sessionEmail is omitted", () => {
    const html = renderToStaticMarkup(<UserNavDropdown />);
    expect(html).toContain("Alex Rivera");
    expect(html).toContain("Owner");
  });
});
