"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { paymentRequest } from "@/lib/payments/client";
import { billingSchema, checkoutSchema, creditInput, deleteOrderSchema, explorerUrl, quoteAtomic, formatUsdc, type Checkout } from "@/lib/payments/contracts";

import { SolanaPayModal } from "./solana-pay-modal";
import "./payments.css";

const sessionSchema = z.object({ tenantId: z.uuid() });

export function BillingPayments() {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } }));
  return <QueryClientProvider client={queryClient}><BillingContent /></QueryClientProvider>;
}

function BillingContent() {
  const client = useQueryClient();
  const [credits, setCredits] = useState("100");
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const idempotency = useRef<{ credits: number; key: string } | null>(null);
  const session = useQuery({ queryKey: ["payment-session"], queryFn: ({ signal }) => paymentRequest("session", sessionSchema, { signal }), staleTime: 0 });
  const start = useMutation({ mutationFn: () => paymentRequest("session", sessionSchema, { method: "POST" }), onSuccess: (data) => {
    client.removeQueries({ queryKey: ["payments"] });
    setCheckout(null);
    client.setQueryData(["payment-session"], data);
  } });
  const billing = useQuery({ queryKey: ["payments", "billing", session.data?.tenantId], queryFn: async ({ signal }) => {
    const data = await paymentRequest("billing", billingSchema, { signal });
    if (data.tenantId !== session.data?.tenantId) {
      void client.invalidateQueries({ queryKey: ["payment-session"] });
      throw new Error("测试会话已改变，正在重新读取账本");
    }
    return data;
  }, enabled: !!session.data && !session.error, refetchInterval: 10000 });
  const create = useMutation({ mutationFn: async () => {
    const input = creditInput.parse({ credits: Number(credits) });
    // Preserve the key on timeout/retry so one click sequence cannot create two quotes.
    if (!idempotency.current || idempotency.current.credits !== input.credits) idempotency.current = { credits: input.credits, key: crypto.randomUUID() };
    return paymentRequest("orders", checkoutSchema, { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": idempotency.current.key }, body: JSON.stringify(input) });
  }, onSuccess: (data) => { setCheckout(data); idempotency.current = null; void client.invalidateQueries({ queryKey: ["payments", "billing"] }); } });
  const recover = useMutation({ mutationFn: (id: string) => paymentRequest(`orders/${id}`, checkoutSchema), onSuccess: setCheckout });
  const cancel = useMutation({
    mutationFn: (id: string) => paymentRequest(`orders/${id}`, checkoutSchema, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    }),
    onSuccess: () => { void client.invalidateQueries({ queryKey: ["payments", "billing"] }); },
  });
  const remove = useMutation({
    mutationFn: (id: string) => paymentRequest(`orders/${id}`, deleteOrderSchema, {
      method: "DELETE",
    }),
    onSuccess: (_data, id) => {
      if (checkout?.order.id === id) setCheckout(null);
      void client.invalidateQueries({ queryKey: ["payments", "billing"] });
    },
  });
  const valid = creditInput.safeParse({ credits: Number(credits) });
  return <div className="space-y-6">
    <header><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Solana Pay · Devnet</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">账单与测试额度</h1><p className="mt-2 text-sm text-zinc-600">此处为隔离的 Devnet 支付验证，不改变其他页面的 Demo 余额，不提供正式服务权益。</p></header>
    <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
      此 Credits 入口使用测试 USDC，SOL 仅用于手续费。100 Credits 起购，每 Credit 0.02 USDC，无赠额。测试额度有效期 12 个月；confirmed 不入账，仅 finalized 且服务端校验完整后入账。
    </section>
    <section className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm"><p>只有 SOL 测试币？无需 USDC，先用 0.001 SOL 跑通钱包付款（不增加 Credits）。</p><Link href="/console/billing/sol-test" className="inline-block font-medium underline">打开原生 SOL 小额测试付款</Link></section>
    {session.isPending && <p role="status">正在读取测试会话…</p>}
    {session.error && <section className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5">
      <p role="alert">{session.error.message}</p><p className="text-sm text-zinc-600">开发者需先配置 PostgreSQL、Devnet 收款地址及本地会话开关。此入口不是生产登录。</p>
      <button className="payment-button" disabled={start.isPending} onClick={() => start.mutate()}>{start.isPending ? "建立中…" : "建立本地 Devnet 测试会话"}</button>
      {start.error && <p role="alert" className="text-sm text-red-700">{start.error.message}</p>}
    </section>}
    {session.data && !session.error && <>
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-5"><h2 className="text-sm text-zinc-600">服务端测试 Credits</h2>
          {billing.isPending ? <p role="status">正在读取账本…</p> : billing.error ? <><p role="alert">{billing.error.message}</p><button className="payment-button mt-3" onClick={() => { void session.refetch(); void billing.refetch(); }}>重试读取</button></> : <p className="mt-3 text-3xl font-semibold">{billing.data.availableCredits.toLocaleString()}</p>}
          <p className="mt-3 break-all text-xs text-zinc-500">测试租户：{session.data.tenantId}</p>
        </div>
        <form className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5" onSubmit={(event) => { event.preventDefault(); if (valid.success && !create.isPending) create.mutate(); }}>
          <label className="block text-sm font-medium" htmlFor="test-credits">购买测试 Credits（100–100,000 整数）</label>
          <input className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" id="test-credits" type="number" min={100} max={100000} step={1} value={credits} disabled={create.isPending} onChange={(event) => setCredits(event.target.value)} aria-describedby="quote-price" />
          <p id="quote-price" className="text-sm">{valid.success ? `预估 ${formatUsdc(quoteAtomic(valid.data.credits))} USDC；以服务端报价为准` : "请输入 100–100,000 的整数"}</p>
          <button className="payment-button" disabled={!valid.success || create.isPending || billing.isError} type="submit" onClick={(event) => { returnFocusRef.current = event.currentTarget; }}>{create.isPending ? "正在创建报价…" : "创建 Devnet 支付报价"}</button>
          {create.error && <p role="alert" className="text-sm text-red-700">{create.error.message}</p>}
        </form>
      </section>
      {recover.error && <p role="alert" className="text-sm text-red-700">{recover.error.message}</p>}
      {billing.data && !billing.error && <>
        <section className="space-y-3"><h2 className="text-lg font-semibold">支付订单</h2>
          {billing.data.orders.length === 0 ? <p className="text-sm text-zinc-600">暂无支付订单。</p> : <ul className="space-y-2">{billing.data.orders.map((order) => <li className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-4" key={order.id}>
            <div className="min-w-0 text-sm"><p>{order.credits.toLocaleString()} Credits · {formatUsdc(order.amountAtomic)} USDC</p><p className="mt-1 break-all text-xs text-zinc-500">{order.id}</p><p className="mt-1">{{ awaiting_payment: "待付款", confirmed: "待最终确认", credited: "已入账", expired: "已过期", review_required: "需核查，勿重复付款" }[order.status]}</p></div>
            <button className="payment-button" disabled={recover.isPending} onClick={(event) => { returnFocusRef.current = event.currentTarget; recover.mutate(order.id); }}>查看 / 恢复订单</button>
          </li>)}</ul>}
        </section>
        <section className="space-y-3"><h2 className="text-lg font-semibold">已校验测试入账流水</h2>
          {billing.data.ledger.length === 0 ? <p className="text-sm text-zinc-600">暂无入账流水。签名、提交或 confirmed 均不会增加额度。</p> : <ul className="space-y-2">{billing.data.ledger.map((row) => <li className="space-y-2 rounded-xl border border-zinc-200 bg-white p-4 text-sm" key={row.orderId}><p>+{row.credits.toLocaleString()} 测试 Credits</p><p>有效至（UTC）：{row.expiresAt}</p><a className="break-all underline" href={explorerUrl(row.signature)} target="_blank" rel="noreferrer">链上凭据：{row.signature}</a></li>)}</ul>}
        </section>
      </>}
    </>}
    {checkout && checkout.order.tenantId === session.data?.tenantId && !session.error && <SolanaPayModal checkout={checkout} returnFocusRef={returnFocusRef} onClose={() => setCheckout(null)} />}
  </div>;
}
