"use client";

import Link from "next/link";
import { useRef, useState, useSyncExternalStore } from "react";
import { QueryClient, QueryClientProvider, useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { paymentRequest } from "@/lib/payments/client";
import { explorerUrl } from "@/lib/payments/contracts";
import { paymentWallet } from "@/lib/payments/wallet";
import { SOL_TEST_AMOUNT, solTestCheckoutSchema, solTestCheckInput, solTestStatusSchema, type SolTestCheckout } from "@/lib/payments/sol-test/contracts";
import { sendSolTest } from "@/lib/payments/sol-test/wallet";
import "./payments.css";

const STORAGE_KEY = "sol-test-recovery-v1";
const recoverySchema = z.object({ checkout: solTestCheckoutSchema, attempt: z.enum(["ready", "attempted"]), signature: z.string() });
type Recovery = z.infer<typeof recoverySchema>;
function readRecovery(): Recovery | null {
  const saved = sessionStorage.getItem(STORAGE_KEY);
  if (!saved) return null;
  return recoverySchema.parse(JSON.parse(saved));
}
export function SolTestPanel() {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } }));
  return <QueryClientProvider client={client}><SolTestContent /></QueryClientProvider>;
}
function SolTestContent() {
  const [initial] = useState(() => {
    try { return { recovery: readRecovery(), error: "" }; }
    catch { return { recovery: null, error: "无法读取本页付款记录，请先核查钱包历史；为防止重复付款，当前已禁用创建。请恢复浏览器存储，或在确认旧交易后清除此站点的会话存储。" }; }
  });
  const [recovery, setRecovery] = useState<Recovery | null>(initial.recovery);
  const [signatureInput, setSignatureInput] = useState(initial.recovery?.signature ?? "");
  const [localError, setLocalError] = useState(initial.error);
  const wallets = useSyncExternalStore(paymentWallet.wallet.subscribe, () => paymentWallet.wallet.getState().wallets, () => paymentWallet.wallet.getState().wallets);
  const connected = useSyncExternalStore(paymentWallet.wallet.subscribe, () => paymentWallet.wallet.getState().connected, () => paymentWallet.wallet.getState().connected);
  const sending = useRef(false);
  function save(next: Recovery | null) {
    // Storage must succeed before allowing a broadcast.
    if (next) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else sessionStorage.removeItem(STORAGE_KEY);
    setRecovery(next);
  }
  const create = useMutation({ mutationFn: () => paymentRequest("sol-test/quote", solTestCheckoutSchema, { method: "POST" }), onSuccess: (checkout: SolTestCheckout) => {
    save({ checkout, attempt: "ready", signature: "" }); setSignatureInput(""); setLocalError("");
  } });
  const connect = useMutation({ mutationFn: async (name: string) => {
    const wallet = wallets.find((item) => item.name === name);
    if (!wallet) throw new Error("钱包不可用");
    await paymentWallet.wallet.connect(wallet);
  } });
  const disconnect = useMutation({ mutationFn: () => paymentWallet.wallet.disconnect() });
  const send = useMutation({ mutationFn: async () => {
    if (!recovery || recovery.attempt === "attempted" || sending.current) throw new Error("已发起过付款，请先核查交易");
    sending.current = true;
    try {
      save({ ...recovery, attempt: "attempted" });
      const signature = await sendSolTest(recovery.checkout.quote);
      save({ ...recovery, attempt: "attempted", signature });
      setSignatureInput(signature);
      return signature;
    } finally { sending.current = false; }
  } });
  const token = recovery?.checkout.token;
  const signature = recovery?.signature;
  const check = useQuery({ queryKey: ["sol-test-check", token, signature], enabled: !!token && !!signature,
    queryFn: ({ signal }) => paymentRequest("sol-test/check", solTestStatusSchema, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, signature }), signal,
    }),
    refetchInterval: (query) => query.state.error || ["verified", "invalid"].includes(query.state.data?.status ?? "") ? false : 5000,
    refetchOnWindowFocus: false,
  });
  const error = localError || create.error?.message || connect.error?.message || disconnect.error?.message || send.error?.message;
  const quote = recovery?.checkout.quote;
  const statuses = { pending: "尚未查到交易，请等待或核对签名；不要重复付款。", confirmed: "已 confirmed，等待 finalized；尚未验证成功。", verified: "SOL 测试支付成功：已 finalized，收款人、金额和 reference 均通过服务端校验。未增加 Credits。", invalid: "链上证据不符合报价，未验证成功。请核查交易，不要重复付款。" };
  return <div className="mx-auto w-full max-w-3xl space-y-5 p-4 md:p-8">
    <Link href="/console/billing" className="text-sm underline">返回账单</Link>
    <header className="space-y-2"><h1 className="text-2xl font-semibold">原生 SOL 小额测试付款</h1><p className="text-sm text-zinc-600">Devnet 实链测试 · 非 USDC · 不购买订阅 / Credits</p></header>
    <section className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
      <p>每笔固定 <strong>{SOL_TEST_AMOUNT} SOL</strong>，另有网络手续费；不开放大额输入。请在钱包中切换到 Devnet，勿使用主网资产。</p>
      <p>只有服务端核验 finalized 交易后才显示成功。签名弹窗或广播完成不等于成功。本地服务重启可能使报价失效，届时请到 Explorer 核查，勿重复支付。</p>
    </section>
    {!recovery && <button className="payment-button" disabled={create.isPending || !!initial.error} onClick={() => create.mutate()}>{create.isPending ? "正在核验网络并创建报价…" : "创建 0.001 SOL 测试付款"}</button>}
    {error && <p className="break-words text-sm text-red-700" role="alert">{error}</p>}
    {quote && recovery && <>
      <section className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5" aria-label="SOL 付款详情">
        <p className="text-2xl font-semibold">{SOL_TEST_AMOUNT} SOL <span className="text-sm font-normal">Devnet</span></p>
        <p className="break-all text-sm">收款地址：{quote.recipient}</p>
        <p className="break-all text-xs text-zinc-500">Reference：{quote.reference}</p>
        <p className="break-words text-sm">报价截止（UTC）：{new Date(quote.expiresAt * 1000).toISOString()}</p>
        {!connected ? <div className="flex flex-wrap gap-2">
          {wallets.length === 0 && <p className="text-sm">未发现兼容钱包。请启用 Phantom / Solflare 等 Wallet Standard 钱包扩展，切换至 Devnet 后刷新此页。</p>}
          {wallets.map((wallet) => <button className="payment-button" key={wallet.name} disabled={connect.isPending} onClick={() => connect.mutate(wallet.name)}>连接 {wallet.name}</button>)}
        </div> : <>
          <p className="break-all text-xs">付款钱包：{connected.account.address}</p>
          <div className="flex flex-wrap gap-2"><button className="payment-button" disabled={send.isPending || recovery.attempt === "attempted" || !!signature} onClick={() => send.mutate()}>{send.isPending ? "等待钱包签名 / 网络响应…" : "确认支付 0.001 SOL"}</button>
            <button className="payment-button" disabled={send.isPending || disconnect.isPending} onClick={() => disconnect.mutate()}>断开钱包</button></div>
        </>}
        {recovery.attempt === "attempted" && <p className="text-sm" role="status">已发起过付款。拒签、余额不足或网络超时后均不会自动重发，请先检查钱包记录。</p>}
        {recovery.attempt === "attempted" && !signature && !send.isPending && <button className="payment-button" onClick={() => {
          try { save({ ...recovery, attempt: "ready" }); send.reset(); setLocalError(""); } catch { setLocalError("无法保存重试状态，请恢复浏览器存储。"); }
        }}>已确认未广播，允许手动重试</button>}
      </section>
      <section className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5" aria-label="链上核验">
        <h2 className="font-semibold">链上核验 / 恢复</h2>
        <form className="space-y-2" onSubmit={(event) => {
          event.preventDefault();
          if (!solTestCheckInput.safeParse({ token, signature: signatureInput.trim() }).success) { setLocalError("请输入有效的 Solana 交易签名"); return; }
          try { save({ ...recovery, signature: signatureInput.trim(), attempt: "attempted" }); setLocalError(""); } catch { setLocalError("无法保存签名，请恢复浏览器存储。"); }
        }}>
          <label htmlFor="sol-signature" className="block text-sm">交易签名（可从钱包历史粘贴，不是私钥）</label>
          <input id="sol-signature" className="w-full min-w-0 rounded-lg border border-zinc-300 p-2 text-sm" value={signatureInput} onChange={(event) => setSignatureInput(event.target.value)} autoComplete="off" disabled={send.isPending} />
          <button className="payment-button" disabled={!signatureInput.trim() || send.isPending}>保存签名并核验</button>
        </form>
        {signature && <>
          <a className="block break-all text-sm underline" target="_blank" rel="noreferrer" href={explorerUrl(signature)}>Devnet Explorer：{signature}</a>
          {check.isFetching && <p role="status">正在查询链上最终状态…</p>}
          {check.error ? <p role="alert" className="text-sm text-red-700">{check.error.message}</p> : check.data && <p role="status" className="text-sm">{statuses[check.data.status]}</p>}
          <button className="payment-button" disabled={check.isFetching || send.isPending} onClick={() => { void check.refetch(); }}>刷新链上状态</button>
        </>}
      </section>
      <p className="text-sm text-zinc-600">开启新测试前先核对旧交易。新报价不会撤销已签名或已广播的交易。</p>
      <button className="payment-button" disabled={send.isPending || check.isFetching} onClick={() => {
        try { save(null); setSignatureInput(""); send.reset(); create.reset(); setLocalError(""); } catch { setLocalError("无法清除本地记录，请恢复浏览器存储。"); }
      }}>已核对旧交易，开始新的测试</button>
    </>}
  </div>;
}
