"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAppStore } from "@/stores/use-app-store";
import { getI18nText } from "@/lib/i18n";
import { paymentRequest } from "@/lib/payments/client";
import { checkoutSchema, deleteOrderSchema, explorerUrl, formatUsdc, type Checkout } from "@/lib/payments/contracts";

const PaymentWallet = dynamic(() => import("./payment-wallet").then((module) => module.PaymentWallet), { ssr: false, loading: () => <p>...</p> });

export interface SolanaPayModalProps {
  open?: boolean;
  checkout?: Checkout;
  onClose: () => void;
  returnFocusRef?: RefObject<HTMLElement | null>;
}

function SolanaPayModalInner({ checkout, onClose, returnFocusRef }: SolanaPayModalProps & { checkout: Checkout }) {
  const { locale } = useAppStore();
  const dialog = useRef<HTMLDialogElement>(null);
  const client = useQueryClient();
  const activeCheckout = checkout;

  const statusLabels = {
    awaiting_payment: getI18nText(locale, "billing_status_awaiting"),
    confirmed: getI18nText(locale, "billing_status_confirmed"),
    credited: getI18nText(locale, "billing_status_credited"),
    expired: getI18nText(locale, "billing_status_expired"),
    review_required: getI18nText(locale, "billing_status_review"),
    cancelled: getI18nText(locale, "billing_status_cancelled"),
  };

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
      <h2 id="payment-title" className="text-lg font-semibold">{getI18nText(locale, "billing_qr_modal_title")}</h2>
      <div className="flex flex-wrap items-center gap-2">
        {order.status === "awaiting_payment" && (
          <button
            className="payment-button text-amber-800 hover:text-amber-900"
            disabled={cancelMutation.isPending || deleteMutation.isPending}
            onClick={() => cancelMutation.mutate()}
          >
            {cancelMutation.isPending ? getI18nText(locale, "billing_qr_cancelling") : getI18nText(locale, "billing_qr_cancel_order")}
          </button>
        )}
        {(order.status === "awaiting_payment" || order.status === "expired" || order.status === "cancelled") && (
          <button
            className="payment-button text-red-600 hover:text-red-700"
            disabled={cancelMutation.isPending || deleteMutation.isPending}
            onClick={() => deleteMutation.mutate()}
          >
            {deleteMutation.isPending ? getI18nText(locale, "status_pending") : getI18nText(locale, "billing_btn_remove")}
          </button>
        )}
        <button className="payment-button" aria-label={getI18nText(locale, "action_close")} onClick={onClose}>{getI18nText(locale, "action_close")}</button>
      </div>
    </div>
    <div className="mt-4 space-y-4">
      {cancelMutation.error && <p role="alert" className="text-sm text-red-700">{cancelMutation.error.message}</p>}
      {deleteMutation.error && <p role="alert" className="text-sm text-red-700">{deleteMutation.error.message}</p>}
      {order.status === "cancelled" && <p className="rounded-lg bg-zinc-100 p-3 text-sm text-zinc-700">{getI18nText(locale, "billing_status_cancelled")}</p>}
      <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{getI18nText(locale, "billing_qr_devnet_only")}</p>
      <p className="text-xl font-semibold">{formatUsdc(order.amountAtomic)} USDC → {order.credits.toLocaleString()} {getI18nText(locale, "user_assets_credits")}</p>
      <p role="status" className="text-sm font-medium">{statusLabels[order.status]}</p>
      <p className="text-xs">{getI18nText(locale, "billing_qr_quote_validity")}：{order.expiresAt.replace("T", " ").replace(".000Z", " UTC")}</p>
      <dl className="space-y-2 break-all text-xs text-zinc-600"><dt>Recipient</dt><dd>{order.recipient}</dd><dt>USDC mint (Devnet)</dt><dd>{order.mint}</dd><dt>Order ID</dt><dd>{order.id}</dd></dl>
      {orderQuery.error && <p role="alert" className="text-sm text-red-700">{orderQuery.error.message}</p>}
      {order.status === "awaiting_payment" && !expired && !orderQuery.error && <>
        <Image className="mx-auto" src={data.qr} alt="Solana Pay QR Code" width={240} height={240} unoptimized />
        <a className="block text-center text-sm underline" href={data.payUrl}>Open in Solana Devnet Wallet</a>
        <PaymentWallet key={order.id} order={order} onSubmitted={() => { void orderQuery.refetch(); }} />
      </>}
      {order.signature && <a className="block text-sm underline" href={explorerUrl(order.signature)} target="_blank" rel="noreferrer">Solana Explorer</a>}
      <button className="payment-button" disabled={orderQuery.isFetching} onClick={() => { void orderQuery.refetch(); }}>{orderQuery.isFetching ? getI18nText(locale, "status_pending") : getI18nText(locale, "billing_btn_refetch")}</button>
    </div>
  </dialog>;
}

// Landing pages have no server quote: navigate rather than fabricate payment data.
function PaymentEntry({ onClose }: { onClose: () => void }) {
  const { locale } = useAppStore();
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement;
    element?.showModal();
    return () => { element?.close(); if (previous instanceof HTMLElement) previous.focus(); };
  }, []);
  return <dialog ref={dialog} aria-labelledby="payment-entry-title" onCancel={onClose} className="m-auto w-[calc(100%_-_2rem)] max-w-lg rounded-xl bg-white p-6 text-zinc-900 backdrop:bg-black/40">
    <h2 id="payment-entry-title" className="text-lg font-semibold">{getI18nText(locale, "billing_qr_modal_title")}</h2>
    <p className="my-4 text-sm">{getI18nText(locale, "billing_devnet_desc")}</p>
    <Link href="/console/billing" className="underline">{getI18nText(locale, "nav_billing")}</Link>
    <button className="ml-6 rounded border px-3 py-2 cursor-pointer" onClick={onClose}>{getI18nText(locale, "action_close")}</button>
  </dialog>;
}

export function SolanaPayModal({ checkout, open, onClose, returnFocusRef }: SolanaPayModalProps) {
  if (open === false) return null;
  return checkout ? <SolanaPayModalInner key={checkout.order.id} checkout={checkout} onClose={onClose} returnFocusRef={returnFocusRef} /> : <PaymentEntry onClose={onClose} />;
}
