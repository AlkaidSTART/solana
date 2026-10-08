import { expect, test, type Page } from "@playwright/test";

const signature = "99eUso3aSbE9tqGSTXzo3WTM7Uu4pM7p1cW6Chpn7oNfZ6jUqM7CZzCEkvCqmkp5HPRFkjLJ5Em67Wq6Vj1Dci1";
const recipient = "8qbHbw2BbbTHBW1sbeqakYXVKRQM8Ne7pLK7m6CVfeR";
async function fixture(page: Page) {
  let status = "pending", fail = false, quotes = 0;
  await page.route("**/api/v1/payments/sol-test/quote", async (route) => {
    quotes++;
    await route.fulfill({ json: { token: "mock-token", quote: { network: "devnet", amountAtomic: "1000000", recipient,
      reference: "CktRuQ2mttgRGkXJtyksdKHjUdc2C4TgDzyB98oEzy8", createdAt: Math.floor(Date.now() / 1000), expiresAt: Math.floor(Date.now() / 1000) + 1200 } } });
  });
  await page.route("**/api/v1/payments/sol-test/check", async (route) => {
    await route.fulfill({ status: fail ? 502 : 200, json: fail ? { error: "Mock RPC 查询失败，请重试核验" } : { status } });
  });
  return { setStatus: (next: string) => { status = next; }, setFail: (next: boolean) => { fail = next; }, quotes: () => quotes };
}
for (const width of [375, 768, 1440]) {
  test(`Mock SOL workflow and recovery at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 950 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const state = await fixture(page);
    await page.goto("/console/billing/sol-test");
    const create = page.getByRole("button", { name: "创建 0.001 SOL 测试付款" });
    await create.focus(); await page.keyboard.press("Enter");
    await expect(page.getByText(`收款地址：${recipient}`)).toBeVisible();
    await expect(page.getByRole("button", { name: /确认支付/ })).toHaveCount(0);
    await page.getByLabel("交易签名（可从钱包历史粘贴，不是私钥）").fill(signature);
    await page.getByRole("button", { name: "保存签名并核验" }).click();
    await expect(page.getByText(/尚未查到交易/)).toBeVisible();
    state.setStatus("confirmed"); await page.getByRole("button", { name: "刷新链上状态" }).click();
    await expect(page.getByText(/已 confirmed，等待 finalized/)).toBeVisible();
    await expect(page.getByText(/SOL 测试支付成功/)).toHaveCount(0);
    state.setFail(true); await page.getByRole("button", { name: "刷新链上状态" }).click();
    await expect(page.locator('p[role="alert"]')).toContainText("Mock RPC 查询失败");
    state.setFail(false); state.setStatus("verified"); await page.getByRole("button", { name: "刷新链上状态" }).click();
    await expect(page.getByText(/SOL 测试支付成功/)).toBeVisible();
    await page.reload();
    await expect(page.getByText(/SOL 测试支付成功/)).toBeVisible();
    expect(state.quotes()).toBe(1);
    await expect(page.getByRole("link", { name: /Devnet Explorer/ })).toHaveAttribute("href", /cluster=devnet/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`sol-test-${width}.png`), fullPage: true });
  });
}
test("Mock SOL config error is recoverable and invalid evidence is not success", async ({ page }) => {
  const state = await fixture(page);
  await page.route("**/api/v1/payments/sol-test/quote", async (route) => route.fulfill({ status: 503, json: { error: "SOL 测试未启用或配置不完整" } }));
  await page.goto("/console/billing/sol-test");
  await page.getByRole("button", { name: "创建 0.001 SOL 测试付款" }).click();
  await expect(page.locator('p[role="alert"]')).toContainText("配置不完整");
  await page.unroute("**/api/v1/payments/sol-test/quote");
  await fixture(page);
  await page.getByRole("button", { name: "创建 0.001 SOL 测试付款" }).click();
  await page.getByLabel("交易签名（可从钱包历史粘贴，不是私钥）").fill("invalid");
  await page.getByRole("button", { name: "保存签名并核验" }).click();
  await expect(page.locator('p[role="alert"]')).toContainText("有效的 Solana 交易签名");
  state.setStatus("invalid");
  await page.route("**/api/v1/payments/sol-test/check", (route) => route.fulfill({ json: { status: "invalid" } }));
  await page.getByLabel("交易签名（可从钱包历史粘贴，不是私钥）").fill(signature);
  await page.getByRole("button", { name: "保存签名并核验" }).click();
  await expect(page.getByText(/链上证据不符合报价/)).toBeVisible();
  await expect(page.getByText(/SOL 测试支付成功/)).toHaveCount(0);
});
test("Mock wallet wrong network prevents auto resend across reload", async ({ page }) => {
  await fixture(page);
  await page.addInitScript(() => {
    const account = { address: "4vJ9JU1bJJE96FWSJKvHsmmFADCg4gpZQff4P3bkLKi", publicKey: new Uint8Array(32).fill(1), chains: ["solana:devnet"], features: ["solana:signTransaction"] };
    const wallet = { version: "1.0.0", name: "Mock Devnet Wallet", icon: "data:image/svg+xml;base64,PHN2Zy8+", chains: ["solana:devnet"], accounts: [account], features: {
      "standard:connect": { version: "1.0.0", connect: async () => ({ accounts: [account] }) },
      "standard:disconnect": { version: "1.0.0", disconnect: async () => undefined },
      "standard:events": { version: "1.0.0", on: () => () => undefined },
      "solana:signTransaction": { version: "1.0.0", supportedTransactionVersions: [0], signTransaction: async () => { throw new Error("must not sign on wrong network"); } },
    } };
    window.addEventListener("wallet-standard:app-ready", (event) => {
      if ("detail" in event && event.detail && typeof event.detail === "object" && "register" in event.detail && typeof event.detail.register === "function") event.detail.register(wallet);
    });
  });
  let calls = 0;
  await page.route("https://api.devnet.solana.com/**", async (route) => {
    calls++; const request = route.request().postDataJSON();
    await route.fulfill({ json: { jsonrpc: "2.0", id: request.id, result: "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp" } });
  });
  await page.goto("/console/billing/sol-test");
  await page.getByRole("button", { name: "创建 0.001 SOL 测试付款" }).click();
  await page.getByRole("button", { name: "连接 Mock Devnet Wallet" }).click();
  const pay = page.getByRole("button", { name: "确认支付 0.001 SOL" });
  await pay.click(); await expect(page.locator('p[role="alert"]')).toContainText("网络不匹配");
  await expect(pay).toBeDisabled(); expect(calls).toBe(1);
  await page.reload();
  await page.getByRole("button", { name: "连接 Mock Devnet Wallet" }).click();
  await expect(pay).toBeDisabled(); expect(calls).toBe(1);
  await page.getByRole("button", { name: "已确认未广播，允许手动重试" }).click();
  await expect(pay).toBeEnabled();
});
