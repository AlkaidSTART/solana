"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { paymentRequest } from "@/lib/payments/client";
import { checkoutSchema, explorerUrl, formatUsdc, type Checkout } from "@/lib/payments/contracts";

const PaymentWallet = dynamic(() => import("./payment-wallet").then((module) => module.PaymentWallet), { ssr: false, loading: () => <p>正在加载钱包…</p> });
const statusLabels = { awaiting_payment: "等待付款", confirmed: "已确认，等待 finalized；尚未入账", credited: "已 finalized 并校验入账", expired: "报价已过期，请勿继续支付" };

const DEFAULT_DEVNET_CHECKOUT: Checkout = {
  order: {
    id: "00000000-0000-4000-8000-000000000001",
    tenantId: "00000000-0000-4000-8000-000000000002",
    network: "devnet",
    reference: "4zHHs87fKk99Lpq1V788k918SolaFlowRef",
    recipient: "SolaFlow9xUSDC882K19z88Kx198aa7DevDevnet",
    recipientAta: "AtaRecipientSolaFlow9xUSDC882K19z88Kx198aa7",
    mint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    amountAtomic: "25000000",
    credits: 2500,
    priceVersion: "credits-2026-10-07",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
    status: "awaiting_payment",
    signature: null,
  },
  payUrl: "solana:SolaFlow9xUSDC882K19z88Kx198aa7DevDevnet?amount=25.000000&spl-token=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  qr: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='white'/><rect x='10' y='10' width='30' height='30' fill='black'/><rect x='60' y='10' width='30' height='30' fill='black'/><rect x='10' y='60' width='30' height='60' fill='black'/></svg>",
};

export interface SolanaPayModalProps {
  open?: boolean;
  checkout?: Checkout;
  onClose: () => void;
}

export function SolanaPayModal({ checkout, open, onClose }: SolanaPayModalProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const client = useQueryClient();
  const isDemo = !checkout;
  const activeCheckout = checkout ?? DEFAULT_DEVNET_CHECKOUT;

  const orderQuery = useQuery({
    queryKey: ["payments", activeCheckout.order.tenantId, "order", activeCheckout.order.id],
    queryFn: async ({ signal }) => {
      const result = await paymentRequest(`orders/${activeCheckout.order.id}`, checkoutSchema, { method: "POST", signal });
      if (result.order.status === "credited") await client.invalidateQueries({ queryKey: ["payments", "billing"] });
      return result;
    },
    initialData: activeCheckout,
    enabled: !isDemo && open !== false,
    refetchInterval: (query) => query.state.data?.order.status === "credited" ? false : 5000,
    retry: false,
  });

  useEffect(() => {
    if (open === false) return;
    const element = dialog.current;
    const previous = document.activeElement;
    element?.showModal();
    return () => { element?.close(); if (previous instanceof HTMLElement) previous.focus(); };
  }, [open]);

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

  if (open === false) return null;

  const expired = order.status === "expired" || isExpired;
  return <dialog ref={dialog} aria-labelledby="payment-title" onCancel={onClose} className="m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-lg overflow-y-auto rounded-xl border border-zinc-200 bg-white p-5 text-zinc-900 shadow-xl backdrop:bg-black/40">
    <div className="flex items-start justify-between gap-4">
      <h2 id="payment-title" className="text-lg font-semibold">Devnet USDC 测试付款</h2>
      <button className="payment-button" aria-label="关闭支付对话框" onClick={onClose}>关闭</button>
    </div>
    <div className="mt-4 space-y-4">
      <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">仅测试网络，不购买正式权益。请在钱包中确认 Devnet、USDC mint、金额与收款人。SOL 手续费 / 账户租金由钱包实际估算。</p>
      <p className="text-xl font-semibold">{formatUsdc(order.amountAtomic)} USDC → {order.credits.toLocaleString()} 测试 Credits</p>
      <p role="status" className="text-sm font-medium">{statusLabels[order.status]}</p>
      <p className="text-xs">报价截止（UTC）：{order.expiresAt.replace("T", " ").replace(".000Z", " UTC")}</p>
      <dl className="space-y-2 break-all text-xs text-zinc-600"><dt>收款人</dt><dd>{order.recipient}</dd><dt>USDC mint（Devnet）</dt><dd>{order.mint}</dd><dt>订单</dt><dd>{order.id}</dd></dl>
      {orderQuery.error && <p role="alert" className="text-sm text-red-700">状态检查失败：{orderQuery.error.message}。不要重复付款，稍后刷新。</p>}
      {order.status === "awaiting_payment" && !expired && <>
        <Image className="mx-auto" src={data.qr} alt="仅限 Devnet 钱包扫描的 Solana Pay 付款二维码" width={240} height={240} unoptimized />
        <a className="block text-center text-sm underline" href={data.payUrl}>用已切换至 Devnet 的钱包打开 Solana Pay</a>
        <PaymentWallet key={order.id} order={order} onSubmitted={() => { void orderQuery.refetch(); }} />
      </>}
      {expired && order.status !== "credited" && <p className="text-sm">支付入口已关闭。已在有效期内上链的付款仍会补偿核对；不要盲目创建新订单重付。</p>}
      {order.signature && <a className="block text-sm underline" href={explorerUrl(order.signature)} target="_blank" rel="noreferrer">在 Solana Explorer 查看真实链上凭据</a>}
      <button className="payment-button" disabled={orderQuery.isFetching} onClick={() => { void orderQuery.refetch(); }}>{orderQuery.isFetching ? "正在核对…" : "刷新订单状态"}</button>
      <p className="text-xs text-zinc-500">关闭后不取消订单；后台 worker 运行时将继续核对。重开账单可恢复订单。</p>
    </div>
  </dialog>;
}
