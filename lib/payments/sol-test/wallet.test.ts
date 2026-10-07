import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccountRole } from "@solana/kit";
import { SYSTEM_PROGRAM_ADDRESS } from "@solana-program/system";

import { quoteFixture, testAddress, testSignature } from "@/tests/support/sol-test-fixtures";
import { DEVNET_GENESIS } from "../contracts";
import { type SolTestQuote } from "./contracts";
import { sendSolTest } from "./wallet";

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

let quote: SolTestQuote;
beforeEach(() => {
  vi.clearAllMocks();
  mock.connected = { supportedTransactionVersions: new Set([0]) };
  mock.genesis.mockResolvedValue(DEVNET_GENESIS);
  mock.sendV0.mockResolvedValue({ context: { signature: testSignature } });
  mock.sendV1.mockResolvedValue({ context: { signature: testSignature } });
  quote = { ...quoteFixture(), createdAt: Math.floor(Date.now() / 1000), expiresAt: Math.floor(Date.now() / 1000) + 1200 };
});
describe("native SOL wallet (mock transport, real instruction encoding)", () => {
  it("constructs exactly 1,000,000 lamports with readonly reference and v0 fallback", async () => {
    expect(await sendSolTest(quote)).toBe(testSignature);
    expect(mock.sendV0).toHaveBeenCalledOnce();
    expect(mock.sendV1).not.toHaveBeenCalled();
    const instructions = mock.sendV0.mock.calls[0][0];
    expect(instructions).toHaveLength(1);
    expect(instructions[0].programAddress).toBe(SYSTEM_PROGRAM_ADDRESS);
    expect(instructions[0].accounts[1].address).toBe(quote.recipient);
    expect(instructions[0].accounts[2]).toEqual({ address: quote.reference, role: AccountRole.READONLY });
    expect(Array.from(instructions[0].data)).toEqual([2, 0, 0, 0, 64, 66, 15, 0, 0, 0, 0, 0]);
  });
  it("selects v1 only if wallet supports it", async () => {
    mock.connected = { supportedTransactionVersions: new Set([0, 1]) };
    await sendSolTest(quote); expect(mock.sendV1).toHaveBeenCalledOnce(); expect(mock.sendV0).not.toHaveBeenCalled();
  });
  it.each(["User rejected request", "Insufficient funds", "Network timeout"])("propagates %s without automatic resend", async (message) => {
    mock.sendV0.mockRejectedValue(new Error(message)); await expect(sendSolTest(quote)).rejects.toThrow(message);
    expect(mock.sendV0).toHaveBeenCalledOnce();
  });
  it("blocks wrong genesis", async () => {
    mock.genesis.mockResolvedValue("mainnet"); await expect(sendSolTest(quote)).rejects.toThrow("网络不匹配"); expect(mock.sendV0).not.toHaveBeenCalled();
  });
  it("blocks expired, self transfer and missing or incompatible wallet", async () => {
    await expect(sendSolTest({ ...quote, expiresAt: 1 })).rejects.toThrow("过期");
    await expect(sendSolTest({ ...quote, recipient: testAddress(1) })).rejects.toThrow("相同");
    mock.connected = null; await expect(sendSolTest(quote)).rejects.toThrow("请先连接");
    mock.connected = { supportedTransactionVersions: new Set(["legacy"]) }; await expect(sendSolTest(quote)).rejects.toThrow("不支持");
    expect(mock.sendV0).not.toHaveBeenCalled();
  });
});
