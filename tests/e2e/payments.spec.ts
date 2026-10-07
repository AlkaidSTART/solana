import { test, expect, type Page } from "@playwright/test";
import QRCode from "qrcode";

import { orderFixture, tenant, testSignature } from "../support/payment-fixtures";
import { paymentUrl, type PaymentOrder } from "../../lib/payments/contracts";

async function fixture(page: Page) {
  let order: PaymentOrder = { ...orderFixture(), createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 1200000).toISOString() };
  let authenticated = true;
  let created = false;
  let fail = false;
  let posts = 0;
  const qr = await QRCode.toDataURL(paymentUrl(order));
  await page.route("**/api/payments/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    const method = route.request().method();
    if (fail) return route.fulfill({ status: 503, json: { error: "Mock RPC 暂不可用" } });
    if (path.endsWith("/session")) {
      if (method === "POST") authenticated = true;
      return route.fulfill({ status: authenticated ? 200 : 401, json: authenticated ? { tenantId: tenant } : { error: "请先建立本地 Devnet 测试会话" } });
    }
    if (path.endsWith("/billing")) return route.fulfill({ json: { tenantId: tenant, availableCredits: order.status === "credited" ? 100 : 0, orders: created ? [order] : [], ledger: order.status === "credited" ? [{ orderId: order.id, credits: 100, signature: testSignature, createdAt: order.createdAt, expiresAt: "2027-10-07T00:00:00.000Z" }] : [] } });
    if (path.endsWith("/orders") && method === "POST") { posts++; created = true; }
    await route.fulfill({ json: { order, payUrl: paymentUrl(order), qr } });
  });
  return { setStatus(status: PaymentOrder["status"]) { order = { ...order, status, signature: status === "credited" ? testSignature : null }; }, setFailed(value: boolean) { fail = value; }, setAuthenticated(value: boolean) { authenticated = value; }, posts: () => posts };
}

for (const width of [375, 768, 1440]) {
  test(`Mock checkout ${width}px: quote, confirmed, finalized, ledger, focus`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const state = await fixture(page);
    await page.goto("/console/billing");
    await expect(page.getByText("暂无支付订单。", { exact: true })).toBeVisible();
    const create = page.getByRole("button", { name: "创建 Devnet 支付报价" });
    await create.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("2.000000 USDC → 100 测试 Credits")).toBeVisible();
    await expect(dialog.getByAltText("仅限 Devnet 钱包扫描的 Solana Pay 付款二维码")).toBeVisible();
    expect(state.posts()).toBe(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    await page.screenshot({ path: `test-results/payment-${width}.png`, fullPage: true });
    state.setStatus("confirmed");
    await dialog.getByRole("button", { name: "刷新订单状态" }).click();
    await expect(dialog.getByText("已确认，等待 finalized；尚未入账")).toBeVisible();
    await expect(page.getByText("暂无入账流水。签名、提交或 confirmed 均不会增加额度。")).toBeVisible();
    state.setStatus("credited");
    await dialog.getByRole("button", { name: "刷新订单状态" }).click();
    await expect(dialog.getByText("已 finalized 并校验入账")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(create).toBeFocused();
    await expect(page.getByText("+100 测试 Credits")).toBeVisible();
    await page.getByRole("button", { name: "查看 / 恢复订单" }).click();
    await expect(page.getByRole("dialog").getByText("已 finalized 并校验入账")).toBeVisible();
  });
}

test("Mock validation, RPC failure/retry and expired order do not fabricate credits", async ({ page }) => {
  const state = await fixture(page);
  await page.goto("/console/billing");
  const input = page.getByLabel("购买测试 Credits（100–100,000 整数）");
  for (const value of ["", "0", "-1", "99", "100.5", "100001"]) { await input.fill(value); await expect(page.getByRole("button", { name: "创建 Devnet 支付报价" })).toBeDisabled(); }
  await input.fill("100");
  await page.getByRole("button", { name: "创建 Devnet 支付报价" }).click();
  state.setFailed(true);
  await page.getByRole("button", { name: "刷新订单状态" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("Mock RPC 暂不可用");
  state.setFailed(false); state.setStatus("expired");
  await page.getByRole("button", { name: "刷新订单状态" }).click();
  await expect(page.getByText("报价已过期，请勿继续支付", { exact: true })).toBeVisible();
  await expect(page.getByRole("dialog").getByRole("img")).toHaveCount(0);
  await expect(page.getByText("+100 测试 Credits")).toHaveCount(0);
});

test("Mock local session bootstrap recovers unauthorized state", async ({ page }) => {
  const state = await fixture(page); state.setAuthenticated(false);
  await page.goto("/console/billing");
  await page.getByRole("button", { name: "建立本地 Devnet 测试会话" }).click();
  await expect(page.getByText("暂无支付订单。", { exact: true })).toBeVisible();
});
