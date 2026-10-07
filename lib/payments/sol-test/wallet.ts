import { AccountRole, address, lamports } from "@solana/kit";
import { solanaRpc } from "@solana/kit-plugin-rpc";
import { getTransferSolInstruction } from "@solana-program/system";

import { DEVNET_GENESIS } from "../contracts";
import { paymentWallet } from "../wallet";
import { solTestQuoteSchema, type SolTestQuote } from "./contracts";

// Public Devnet only; private server RPC credentials never enter the browser.
const rpcUrl = "https://api.devnet.solana.com";
const v1 = paymentWallet.use(solanaRpc({ rpcUrl, transactionConfig: { version: 1, priorityFeeLamports: lamports(0n) } }));
const v0 = paymentWallet.use(solanaRpc({ rpcUrl, transactionConfig: { version: 0, priorityFeeLamports: lamports(0n) } }));
export async function sendSolTest(input: SolTestQuote): Promise<string> {
  const quote = solTestQuoteSchema.parse(input);
  const connected = paymentWallet.wallet.getState().connected;
  if (!connected) throw new Error("请先连接 Devnet 钱包");
  if (Date.now() >= quote.expiresAt * 1000) throw new Error("报价已过期，请核对旧交易后创建新报价");
  if (!connected.supportedTransactionVersions.has(1) && !connected.supportedTransactionVersions.has(0)) throw new Error("钱包不支持版本化交易，请升级钱包");
  const client = connected.supportedTransactionVersions.has(1) ? v1 : v0;
  if (client.payer.address === quote.recipient) throw new Error("付款与收款地址相同，请使用不同的 Devnet 收款钱包");
  const abortSignal = AbortSignal.timeout(120_000);
  if (await client.rpc.getGenesisHash().send({ abortSignal }) !== DEVNET_GENESIS) throw new Error("RPC 网络不匹配，已阻止付款");
  const instruction = getTransferSolInstruction({ source: client.payer, destination: address(quote.recipient), amount: BigInt(quote.amountAtomic) });
  const result = await client.sendTransaction([
    { ...instruction, accounts: [...instruction.accounts, { address: address(quote.reference), role: AccountRole.READONLY }] },
  ], { abortSignal });
  return result.context.signature;
}
