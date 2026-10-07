import { AccountRole, address, createClient } from "@solana/kit";
import { solanaRpc } from "@solana/kit-plugin-rpc";
import { walletSigner } from "@solana/kit-plugin-wallet";
import { findAssociatedTokenPda, getCreateAssociatedTokenIdempotentInstructionAsync, getTransferCheckedInstruction, TOKEN_PROGRAM_ADDRESS } from "@solana-program/token";

import { DEVNET_GENESIS, type PaymentOrder } from "./contracts";

// Browser-lifetime registry; the plugin supplies an inert stub during SSR.
export const paymentWallet = createClient().use(walletSigner({ chain: "solana:devnet", autoConnect: false }));
const rpcUrl = "https://api.devnet.solana.com";
const v1 = paymentWallet.use(solanaRpc({ rpcUrl, transactionConfig: { version: 1 } }));
const v0 = paymentWallet.use(solanaRpc({ rpcUrl, transactionConfig: { version: 0 } }));

export async function sendPayment(order: PaymentOrder): Promise<string> {
  const connected = paymentWallet.wallet.getState().connected;
  if (!connected) throw new Error("请先连接 Devnet 钱包");
  if (order.status !== "awaiting_payment" || Date.now() >= Date.parse(order.expiresAt)) throw new Error("报价已过期或已检测到支付，请刷新状态");
  if (!connected.supportedTransactionVersions.has(1) && !connected.supportedTransactionVersions.has(0)) throw new Error("钱包不支持版本化交易，请升级钱包或扫码支付");
  const client = connected.supportedTransactionVersions.has(1) ? v1 : v0;
  const abortSignal = AbortSignal.timeout(120_000);
  if (await client.rpc.getGenesisHash().send({ abortSignal }) !== DEVNET_GENESIS) throw new Error("RPC 网络不匹配，已阻止付款");
  const mint = address(order.mint);
  const [destination] = await findAssociatedTokenPda({ owner: address(order.recipient), mint, tokenProgram: TOKEN_PROGRAM_ADDRESS });
  if (destination !== order.recipientAta) throw new Error("收款账户不匹配");
  const [source] = await findAssociatedTokenPda({ owner: client.payer.address, mint, tokenProgram: TOKEN_PROGRAM_ADDRESS });
  const createAta = await getCreateAssociatedTokenIdempotentInstructionAsync({ payer: client.payer, owner: address(order.recipient), mint });
  const transfer = getTransferCheckedInstruction({ source, mint, destination, authority: client.payer, amount: BigInt(order.amountAtomic), decimals: 6 });
  const result = await client.sendTransaction([
    createAta,
    { ...transfer, accounts: [...transfer.accounts, { address: address(order.reference), role: AccountRole.READONLY }] },
  ], { abortSignal });
  return result.context.signature;
}
