import "server-only";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { z } from "zod";

import { paymentConfig } from "./config";
import { database } from "./database";

const COOKIE = "solaflow_devnet_session";
const digest = (token: string) => createHash("sha256").update(token).digest("hex");
export class PaymentHttpError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}
export function assertOrigin(request: Request) {
  if (request.headers.get("origin") !== paymentConfig().origin) throw new PaymentHttpError(403, "请求来源不匹配");
}
export async function readBody(request: Request): Promise<unknown> {
  if (!request.headers.get("content-type")?.includes("application/json")) throw new PaymentHttpError(415, "需要 JSON 请求");
  const text = await request.text();
  if (text.length > 2048) throw new PaymentHttpError(413, "请求过大");
  try { return JSON.parse(text); } catch { throw new PaymentHttpError(400, "JSON 格式错误"); }
}
export async function tenantSession(): Promise<string> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) throw new PaymentHttpError(401, "请先建立本地 Devnet 测试会话");
  const { rows } = await database().query("SELECT tenant_id FROM payment_sessions WHERE token_hash=$1 AND expires_at>now()", [digest(token)]);
  if (!rows[0]) throw new PaymentHttpError(401, "测试会话已过期，请重新建立");
  return z.uuid().parse(rows[0].tenant_id);
}
export async function createLocalSession(request: Request) {
  assertOrigin(request);
  const hostname = new URL(request.url).hostname;
  if (process.env.NODE_ENV === "production" || process.env.PAYMENTS_ALLOW_LOCAL_SESSION !== "true" || !["localhost", "127.0.0.1", "[::1]"].includes(hostname)) throw new PaymentHttpError(403, "本地测试会话未启用；此入口不能用于生产登录");
  try { return await tenantSession(); } catch (error) { if (!(error instanceof PaymentHttpError) || error.status !== 401) throw error; }
  const token = randomBytes(32).toString("hex");
  const tenant = randomUUID();
  await database().query("INSERT INTO payment_sessions(token_hash,tenant_id,expires_at) VALUES ($1,$2,now()+interval '7 days')", [digest(token), tenant]);
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: "strict", secure: new URL(request.url).protocol === "https:", path: "/", maxAge: 7 * 24 * 3600 });
  return tenant;
}
export async function paymentResponse(work: () => Promise<unknown>) {
  try { return Response.json(await work(), { headers: { "Cache-Control": "no-store" } }); }
  catch (error) {
    const status = error instanceof PaymentHttpError ? error.status : error instanceof z.ZodError ? 400 : 503;
    const message = error instanceof PaymentHttpError ? error.message : error instanceof z.ZodError ? "输入或服务端配置不符合要求" : "支付服务暂不可用，请检查数据库、Devnet RPC 和服务端配置后重试；不会自动增加额度";
    return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
  }
}
