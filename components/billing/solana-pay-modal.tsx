"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { paymentRequest } from "@/lib/payments/client";
import { checkoutSchema, deleteOrderSchema, explorerUrl, formatUsdc, type Checkout } from "@/lib/payments/contracts";

const PaymentWallet = dynamic(() => import("./payment-wallet").then((module) => module.PaymentWallet), { ssr: false, loading: () => <p>正在加载钱包…</p> });
const statusLabels = { awaiting_payment: "等待付款", confirmed: "已确认，等待 finalized；尚未入账", credited: "已 finalized 并校验入账", expired: "报价已过期，请勿继续支付", review_required: "付款证据需核查，尚未入账；请勿重复付款", cancelled: "订单已取消" };

export interface SolanaPayModalProps {
  open?: boolean;
  checkout?: Checkout;
  onClose: () => void;
  returnFocusRef?: RefObject<HTMLElement | null>;
}

function SolanaPayModalInner({ checkout, onClose, returnFocusRef }: SolanaPayModalProps & { checkout: Checkout }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const client = useQueryClient();
  const activeCheckout = checkout;

  const orderQuery = useQuery({
    queryKey: ["payments", activeCheckout.order.tenantId, "order", activeCheckout.order.id],
    queryFn: async ({ signal }) => {
      const result = await paymentRequest(`orders/${activeCheckout.order.id}`, checkoutSchema, { method: "POST", signal });
      if (result.order.tenantId !== activeCheckout.order.tenantId || result.order.id !== activeCheckout.order.id) throw new Error("会话或订单已改变，请重新打开账单");
      if (result.order.status === "credited") await client.invalidateQueries({ queryKey: ["payments", "billing"] });
      return result;
    },
    initialData: activeCheckout,
    refetchInterval: (query) => (query.state.data?.order.status === "credited" || query.state.data?.order.status === "cancelled") ? false : 5000,
    retry: false,
  });

  const cancelMutation = useMutation({
    mutationFn: () => paymentRequest(`orders/${activeCheckout.order.id}`, checkoutSchema, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["payments", "billing"] });
      onClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => paymentRequest(`orders/${activeCheckout.order.id}`, deleteOrderSchema, {
      method: "DELETE",
    }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["payments", "billing"] });
      onClose();
    },
  });

  useEffect(() => {
    const element = dialog.current;
    // Async quote creation disables the trigger before this dialog mounts.
    const previous = returnFocusRef?.current ?? document.activeElement;
    element?.showModal();
    return () => { element?.close(); if (previous instanceof HTMLElement) previous.focus(); };
  }, [returnFocusRef]);

  const data = orderQuery.data;
  const order = data.order;
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const checkExpiration = () => {
      if (order.status === "expired" || Date.now() >= Date.parse(order.expiresAt)) {
        setIsExpired(true);
      }
    };
    checkExpiration();
    const interval = setInterval(checkExpiration, 1000);
    return () => clearInterval(interval);
  }, [order.status, order.expiresAt]);

  const expired = order.status === "expired" || isExpired;
  return <dialog ref={dialog} aria-labelledby="payment-title" onCancel={onClose} className="m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-lg overflow-y-auto rounded-xl border border-zinc-200 bg-white p-5 text-zinc-900 shadow-xl backdrop:bg-black/40">
    <div className="flex items-start justify-between gap-4">
      <h2 id="payment-title" className="text-lg font-semibold">Devnet USDC 测试付款</h2>
      <div className="flex flex-wrap items-center gap-2">
        {order.status === "awaiting_payment" && (
          <button
            className="payment-button text-amber-800 hover:text-amber-900"
            aria-label="取消此订单并退出"
            disabled={cancelMutation.isPending || deleteMutation.isPending}
            onClick={() => cancelMutation.mutate()}
          >
            {cancelMutation.isPending ? "取消中…" : "取消订单"}
          </button>
        )}
        {(order.status === "awaiting_payment" || order.status === "expired" || order.status === "cancelled") && (
          <button
            className="payment-button text-red-600 hover:text-red-700"
            aria-label="删除此订单并退出"
            disabled={cancelMutation.isPending || deleteMutation.isPending}
            onClick={() => deleteMutation.mutate()}
          >
            {deleteMutation.isPending ? "删除中…" : "删除订单"}
          </button>
        )}
        <button className="payment-button" aria-label="关闭支付对话框" onClick={onClose}>关闭</button>
      </div>
    </div>
    <div className="mt-4 space-y-4">
      {cancelMutation.error && <p role="alert" className="text-sm text-red-700">{cancelMutation.error.message}</p>}
      {deleteMutation.error && <p role="alert" className="text-sm text-red-700">{deleteMutation.error.message}</p>}
      {order.status === "cancelled" && <p className="rounded-lg bg-zinc-100 p-3 text-sm text-zinc-700">订单已取消，支付入口已关闭。如需重新购买，请关闭后重新创建报价。</p>}
      <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">仅测试网络，不购买正式权益。请在钱包中确认 Devnet、USDC mint、金额与收款人。SOL 手续费 / 账户租金由钱包实际估算。</p>
      <p className="text-xl font-semibold">{formatUsdc(order.amountAtomic)} USDC → {order.credits.toLocaleString()} 测试 Credits</p>
      <p role="status" className="text-sm font-medium">{statusLabels[order.status]}</p>
      <p className="text-xs">报价截止（UTC）：{order.expiresAt.replace("T", " ").replace(".000Z", " UTC")}</p>
      <dl className="space-y-2 break-all text-xs text-zinc-600"><dt>收款人</dt><dd>{order.recipient}</dd><dt>USDC mint（Devnet）</dt><dd>{order.mint}</dd><dt>订单</dt><dd>{order.id}</dd></dl>
      {orderQuery.error && <p role="alert" className="text-sm text-red-700">状态检查失败：{orderQuery.error.message}。不要重复付款，稍后刷新。</p>}
      {order.status === "awaiting_payment" && !expired && !orderQuery.error && <>
        <Image className="mx-auto" src={data.qr} alt="仅限 Devnet 钱包扫描的 Solana Pay 付款二维码" width={240} height={240} unoptimized />
        <a className="block text-center text-sm underline" href={data.payUrl}>用已切换至 Devnet 的钱包打开 Solana Pay</a>
        <PaymentWallet key={order.id} order={order} onSubmitted={() => { void orderQuery.refetch(); }} />
      </>}
      {expired && order.status !== "credited" && <p className="text-sm">支付入口已关闭。已在有效期内上链的付款仍会补偿核对；不要盲目创建新订单重付。</p>}
      {order.signature && <a className="block text-sm underline" href={explorerUrl(order.signature)} target="_blank" rel="noreferrer">在 Solana Explorer 查看真实链上凭据</a>}
      <button className="payment-button" disabled={orderQuery.isFetching} onClick={() => { void orderQuery.refetch(); }}>{orderQuery.isFetching ? "正在核对…" : "刷新订单状态"}</button>
      <p className="text-xs text-zinc-500">点击“关闭”保留后台核对；可点击“取消订单”或“删除订单”退出并清理。</p>
    </div>
  </dialog>;
}

// Landing pages have no server quote: navigate rather than fabricate payment data.
function PaymentEntry({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement;
    element?.showModal();
    return () => { element?.close(); if (previous instanceof HTMLElement) previous.focus(); };
  }, []);
  return <dialog ref={dialog} aria-labelledby="payment-entry-title" onCancel={onClose} className="m-auto w-[calc(100%_-_2rem)] max-w-lg rounded-xl bg-white p-6 text-zinc-900 backdrop:bg-black/40">
    <h2 id="payment-entry-title" className="text-lg font-semibold">创建 Devnet 测试支付</h2>
    <p className="my-4 text-sm">请到账单页建立本地测试会话并创建服务端报价。此入口不提供假订单或正式权益。</p>
    <Link href="/console/billing" className="underline">前往账单页</Link>
    <button className="ml-6 rounded border px-3 py-2" onClick={onClose}>关闭</button>
  </dialog>;
}

export function SolanaPayModal({ checkout, open, onClose, returnFocusRef }: SolanaPayModalProps) {
  if (open === false) return null;
  return checkout ? <SolanaPayModalInner key={checkout.order.id} checkout={checkout} onClose={onClose} returnFocusRef={returnFocusRef} /> : <PaymentEntry onClose={onClose} />;
}
