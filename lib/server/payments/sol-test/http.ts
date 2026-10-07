import "server-only";
import { address } from "@solana/kit";
import { SYSTEM_PROGRAM_ADDRESS } from "@solana-program/system";
import { z } from "zod";

import { solTestCheckInput } from "@/lib/payments/sol-test/contracts";
import { paymentChain } from "../rpc";
import { createSolTestQuotes } from "./quote";
import { checkSolTest } from "./service";

const envSchema = z.object({ SOLANA_RECIPIENT: z.string(), SOLANA_RPC_URL: z.url().default("https://api.devnet.solana.com"), PAYMENT_APP_ORIGIN: z.url() });
function config() {
  if (process.env.NODE_ENV === "production" || process.env.PAYMENTS_DEVNET_ENABLED !== "true") throw new Error("disabled");
  const env = envSchema.parse(process.env);
  const recipient = address(env.SOLANA_RECIPIENT);
  if (recipient === SYSTEM_PROGRAM_ADDRESS) throw new Error("invalid_recipient");
  return { recipient, rpcUrl: env.SOLANA_RPC_URL, origin: new URL(env.PAYMENT_APP_ORIGIN).origin };
}
const json = (value: unknown, status = 200) => Response.json(value, { status, headers: { "Cache-Control": "no-store" } });
export async function solTestRequest(request: Request, action: "quote" | "check") {
  let settings: ReturnType<typeof config>;
  try { settings = config(); } catch {
    return json({ error: "SOL 测试未启用或配置不完整。仅本地 Devnet：检查 PAYMENTS_DEVNET_ENABLED、SOLANA_RECIPIENT、SOLANA_RPC_URL、PAYMENT_APP_ORIGIN；无需 USDC 或数据库。" }, 503);
  }
  if (request.headers.get("origin") !== settings.origin || new URL(request.url).origin !== settings.origin) return json({ error: "请求来源不匹配" }, 403);
  const quotes = createSolTestQuotes();
  const chain = paymentChain(settings.rpcUrl);
  if (action === "quote") {
    try {
      await chain.genesis();
      return json(quotes.issue(settings.recipient));
    } catch { return json({ error: "Devnet RPC 不可用或网络错误，未创建付款。请检查配置后重试。" }, 502); }
  }
  let input: z.infer<typeof solTestCheckInput>;
  try {
    const body = await request.text();
    if (body.length > 4096) return json({ error: "请求过大" }, 413);
    input = solTestCheckInput.parse(JSON.parse(body));
  } catch { return json({ error: "请输入有效的交易签名与测试报价。" }, 400); }
  let quote;
  try { quote = quotes.read(input.token, settings.recipient); } catch {
    return json({ error: "报价无效或本地服务已重启。请到 Devnet Explorer 核对已有交易，不要重复付款。" }, 400);
  }
  try { return json(await checkSolTest(chain, quote, input.signature)); }
  catch { return json({ error: "链上查询暂时失败，请重试核验；不要重复付款。" }, 502); }
}
