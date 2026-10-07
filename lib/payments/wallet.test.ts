import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccountRole, address } from "@solana/kit";
import { findAssociatedTokenPda, TOKEN_PROGRAM_ADDRESS } from "@solana-program/token";

import { orderFixture, testAddress, testSignature } from "../../tests/support/payment-fixtures";

import { DEVNET_GENESIS, type PaymentOrder } from "./contracts";
import { sendPayment } from "./wallet";

const mock = vi.hoisted(() => ({
  connected: { supportedTransactionVersions: new Set<number | string>([0]) } as { supportedTransactionVersions: Set<number | string> } | null,
  genesis: vi.fn(), sendV0: vi.fn(), sendV1: vi.fn(),
}));
vi.mock("@solana/kit-plugin-wallet", () => ({ walletSigner: () => ({}) }));
vi.mock("@solana/kit-plugin-rpc", () => ({ solanaRpc: (config: { transactionConfig: { version: number } }) => config }));
vi.mock("@solana/kit", async (importOriginal) => {
  const kit = await importOriginal<typeof import("@solana/kit")>();
  const payer = kit.createNoopSigner(kit.address(kit.getBase58Decoder().decode(new Uint8Array(32).fill(1))));
  const root = {
    wallet: { getState: () => ({ connected: mock.connected }) },
    use: (config: { transactionConfig?: { version: number } }) => config.transactionConfig ? {
      payer, rpc: { getGenesisHash: () => ({ send: mock.genesis }) },
      sendTransaction: config.transactionConfig.version === 1 ? mock.sendV1 : mock.sendV0,
    } : root,
  };
  return { ...kit, createClient: () => root };
});

let order: PaymentOrder;
beforeEach(async () => {
  vi.clearAllMocks();
  mock.connected = { supportedTransactionVersions: new Set([0]) };
  mock.genesis.mockResolvedValue(DEVNET_GENESIS);
  mock.sendV0.mockResolvedValue({ context: { signature: testSignature } });
  mock.sendV1.mockResolvedValue({ context: { signature: testSignature } });
  order = { ...orderFixture(), createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 1200000).toISOString() };
  const [ata] = await findAssociatedTokenPda({ owner: address(order.recipient), mint: address(order.mint), tokenProgram: TOKEN_PROGRAM_ADDRESS });
  order.recipientAta = ata;
});

describe("wallet payment construction (mock transport, no real funds)", () => {
  it("uses real token instructions with exact amount, ATA and readonly reference; v0 fallback", async () => {
    await expect(sendPayment(order)).resolves.toBe(testSignature);
    expect(mock.sendV0).toHaveBeenCalledOnce();
    expect(mock.sendV1).not.toHaveBeenCalled();
    const instructions = mock.sendV0.mock.calls[0][0];
    expect(instructions).toHaveLength(2);
    expect(instructions[1].programAddress).toBe(TOKEN_PROGRAM_ADDRESS);
    expect(instructions[1].accounts[2].address).toBe(order.recipientAta);
    expect(instructions[1].accounts.at(-1)).toEqual({ address: order.reference, role: AccountRole.READONLY });
    expect(Array.from(instructions[1].data)).toEqual([12, 128, 132, 30, 0, 0, 0, 0, 0, 6]);
    expect(order.status).toBe("awaiting_payment");
  });
  it("selects v1 only when supported", async () => {
    mock.connected = { supportedTransactionVersions: new Set([0, 1]) };
    await sendPayment(order);
    expect(mock.sendV1).toHaveBeenCalledOnce();
    expect(mock.sendV0).not.toHaveBeenCalled();
  });
  it.each(["User rejected request", "Insufficient funds", "Transaction expired", "Network timeout"])("propagates %s without retry or credits", async (message) => {
    mock.sendV0.mockRejectedValue(new Error(message));
    await expect(sendPayment(order)).rejects.toThrow(message);
    expect(mock.sendV0).toHaveBeenCalledOnce();
    expect(order.status).toBe("awaiting_payment");
  });
  it("blocks incorrect genesis before any wallet send", async () => {
    mock.genesis.mockResolvedValue("mainnet");
    await expect(sendPayment(order)).rejects.toThrow("网络不匹配");
    expect(mock.sendV0).not.toHaveBeenCalled();
  });
  it("blocks a mismatched recipient ATA", async () => {
    order.recipientAta = testAddress(9);
    await expect(sendPayment(order)).rejects.toThrow("收款账户不匹配");
    expect(mock.sendV0).not.toHaveBeenCalled();
  });
  it("requires a connected versioned wallet", async () => {
    mock.connected = null;
    await expect(sendPayment(order)).rejects.toThrow("请先连接");
    mock.connected = { supportedTransactionVersions: new Set(["legacy"]) };
    await expect(sendPayment(order)).rejects.toThrow("不支持版本化交易");
    expect(mock.sendV0).not.toHaveBeenCalled();
  });
  it.each(["confirmed", "credited", "expired"] as const)("prevents resending %s orders", async (status) => {
    await expect(sendPayment({ ...order, status })).rejects.toThrow("报价已过期或已检测到支付");
    expect(mock.sendV0).not.toHaveBeenCalled();
  });
  it("prevents sending an expired quote even with awaiting status", async () => {
    order.expiresAt = new Date(Date.now() - 1).toISOString();
    await expect(sendPayment(order)).rejects.toThrow("报价已过期");
    expect(mock.sendV0).not.toHaveBeenCalled();
  });
});
