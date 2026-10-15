"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { paymentRequest } from "@/lib/payments/client";
import { billingSchema, checkoutSchema, creditInput, deleteOrderSchema, explorerUrl, quoteAtomic, formatUsdc, type Checkout } from "@/lib/payments/contracts";

import { useAppStore } from "@/stores/use-app-store";
import { getI18nText } from "@/lib/i18n";
import { SolanaPayModal } from "./solana-pay-modal";
import "./payments.css";

const sessionSchema = z.object({ tenantId: z.uuid() });

export function BillingPayments() {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } }));
  return <QueryClientProvider client={queryClient}><BillingContent /></QueryClientProvider>;
}

function BillingContent() {
  const { locale } = useAppStore();
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
    <header>
      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Solana Pay · Devnet</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">{getI18nText(locale, "billing_devnet_title")}</h1>
      <p className="mt-2 text-sm text-zinc-600">{getI18nText(locale, "billing_devnet_desc")}</p>
    </header>
    <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
      {getI18nText(locale, "billing_notice")}
    </section>
    <section className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
      <p>{getI18nText(locale, "billing_sol_test_promo")}</p>
      <Link href="/console/billing/sol-test" className="inline-block font-medium underline">{getI18nText(locale, "billing_sol_test_link")}</Link>
    </section>
    {session.isPending && <p role="status">{getI18nText(locale, "billing_session_loading")}</p>}
    {session.error && <section className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5">
      <p role="alert">{session.error.message}</p>
      <p className="text-sm text-zinc-600">{getI18nText(locale, "billing_session_auth_desc")} <Link href="/login" className="underline">{getI18nText(locale, "billing_session_login_btn")}</Link></p>
      <button className="payment-button" disabled={start.isPending} onClick={() => start.mutate()}>{start.isPending ? getI18nText(locale, "billing_creating_session") : getI18nText(locale, "billing_create_session_btn")}</button>
      {start.error && <p role="alert" className="text-sm text-red-700">{start.error.message}</p>}
    </section>}
    {session.data && !session.error && <>
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-sm text-zinc-600">{getI18nText(locale, "billing_server_credits")}</h2>
          {billing.isPending ? <p role="status">{getI18nText(locale, "billing_reading_ledger")}</p> : billing.error ? <><p role="alert">{billing.error.message}</p><button className="payment-button mt-3" onClick={() => { void session.refetch(); void billing.refetch(); }}>{getI18nText(locale, "billing_retry_read")}</button></> : <p className="mt-3 text-3xl font-semibold">{billing.data.availableCredits.toLocaleString()}</p>}
          <p className="mt-3 break-all text-xs text-zinc-500">{getI18nText(locale, "billing_tenant_label")}：{session.data.tenantId}</p>
        </div>
        <form className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5" onSubmit={(event) => { event.preventDefault(); if (valid.success && !create.isPending) create.mutate(); }}>
          <label className="block text-sm font-medium" htmlFor="test-credits">{getI18nText(locale, "billing_buy_title")}</label>
          <input className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" id="test-credits" type="number" min={100} max={100000} step={1} value={credits} disabled={create.isPending} onChange={(event) => setCredits(event.target.value)} aria-describedby="quote-price" />
          <p id="quote-price" className="text-sm">{valid.success ? `预估 ${formatUsdc(quoteAtomic(valid.data.credits))} USDC；以服务端报价为准` : getI18nText(locale, "billing_input_hint")}</p>
          <button className="payment-button" disabled={!valid.success || create.isPending || billing.isError} type="submit" onClick={(event) => { returnFocusRef.current = event.currentTarget; }}>{create.isPending ? getI18nText(locale, "billing_quote_creating") : getI18nText(locale, "billing_create_quote_btn")}</button>
          {create.error && <p role="alert" className="text-sm text-red-700">{create.error.message}</p>}
        </form>
      </section>
      {recover.error && <p role="alert" className="text-sm text-red-700">{recover.error.message}</p>}
      {cancel.error && <p role="alert" className="text-sm text-red-700">{cancel.error.message}</p>}
      {remove.error && <p role="alert" className="text-sm text-red-700">{remove.error.message}</p>}
      {billing.data && !billing.error && <>
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{getI18nText(locale, "billing_orders_title")}</h2>
          {billing.data.orders.length === 0 ? <p className="text-sm text-zinc-600">{getI18nText(locale, "billing_orders_empty")}</p> : <ul className="space-y-2">{billing.data.orders.map((order) => <li className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-4" key={order.id}>
            <div className="min-w-0 text-sm">
              <p>{order.credits.toLocaleString()} Credits · {formatUsdc(order.amountAtomic)} USDC</p>
              <p className="mt-1 break-all text-xs text-zinc-500">{order.id}</p>
              <p className="mt-1">{{
                awaiting_payment: getI18nText(locale, "billing_status_awaiting"),
                confirmed: getI18nText(locale, "billing_status_confirmed"),
                credited: getI18nText(locale, "billing_status_credited"),
                expired: getI18nText(locale, "billing_status_expired"),
                review_required: getI18nText(locale, "billing_status_review"),
                cancelled: getI18nText(locale, "billing_status_cancelled"),
              }[order.status]}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {order.status !== "cancelled" && (
                <button className="payment-button" disabled={recover.isPending || cancel.isPending || remove.isPending} onClick={(event) => { returnFocusRef.current = event.currentTarget; recover.mutate(order.id); }}>{getI18nText(locale, "billing_btn_open_qr")}</button>
              )}
              {order.status === "awaiting_payment" && (
                <button className="payment-button text-amber-800 hover:text-amber-900" disabled={recover.isPending || cancel.isPending || remove.isPending} onClick={() => cancel.mutate(order.id)}>{cancel.isPending ? getI18nText(locale, "status_pending") : getI18nText(locale, "billing_btn_cancel_unpaid")}</button>
              )}
              {(order.status === "awaiting_payment" || order.status === "expired" || order.status === "cancelled") && (
                <button className="payment-button text-red-600 hover:text-red-700" disabled={recover.isPending || cancel.isPending || remove.isPending} onClick={() => remove.mutate(order.id)}>{remove.isPending ? getI18nText(locale, "status_pending") : getI18nText(locale, "billing_btn_remove")}</button>
              )}
            </div>
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
