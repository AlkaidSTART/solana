"use client";

import { useState, useSyncExternalStore } from "react";
import { useMutation } from "@tanstack/react-query";

import { explorerUrl, type PaymentOrder } from "@/lib/payments/contracts";
import { paymentWallet, sendPayment } from "@/lib/payments/wallet";

function useWallets(client: typeof paymentWallet) {
  return useSyncExternalStore(
    client.wallet.subscribe,
    () => client.wallet.getState().wallets,
    () => client.wallet.getState().wallets,
  );
}

function useConnectedWallet(client: typeof paymentWallet) {
  return useSyncExternalStore(
    client.wallet.subscribe,
    () => client.wallet.getState().connected,
    () => client.wallet.getState().connected,
  );
}

export function PaymentWallet({ order, onSubmitted }: { order: PaymentOrder; onSubmitted: () => void }) {
  const wallets = useWallets(paymentWallet);
  const connected = useConnectedWallet(paymentWallet);
  const [attempted, setAttempted] = useState(() => sessionStorage.getItem(`payment-attempt:${order.id}`) === "yes");
  const connect = useMutation({ mutationFn: async (name: string) => {
    const wallet = wallets.find((item) => item.name === name);
    if (!wallet) throw new Error("钱包不可用");
    await paymentWallet.wallet.connect(wallet);
  } });
  const disconnect = useMutation({ mutationFn: () => paymentWallet.wallet.disconnect() });
  const send = useMutation({ mutationFn: async () => {
    // A timeout may mean broadcast succeeded. Persist the guard across dialog/reload.
    sessionStorage.setItem(`payment-attempt:${order.id}`, "yes");
    setAttempted(true);
    return sendPayment(order);
  }, onSettled: onSubmitted });
  const error = connect.error ?? disconnect.error;
  return <section className="space-y-3 border-t border-zinc-200 pt-4" aria-label="钱包付款">
    {error && <p role="alert" className="text-sm text-red-700">钱包操作失败或被拒绝，请重试。</p>}
    {!connected ? <>
      <p className="text-sm text-zinc-600">连接 Wallet Standard 钱包，或在上方使用 Devnet 钱包扫码。</p>
      {wallets.length === 0 && <p className="text-sm">未发现兼容钱包。请启用钱包扩展并切换至 Devnet；不要使用主网资产。</p>}
      {wallets.map((wallet) => <button className="payment-button mr-2" key={wallet.name} disabled={connect.isPending} onClick={() => connect.mutate(wallet.name)}>连接 {wallet.name}</button>)}
    </> : <>
      <p className="break-all text-xs text-zinc-600">付款钱包：{connected.account.address}</p>
      <button className="payment-button" disabled={send.isPending || attempted || order.status !== "awaiting_payment"} onClick={() => send.mutate()}>{send.isPending ? "等待钱包 / 网络响应…" : "确认使用 Devnet USDC 支付"}</button>
      <button className="payment-button ml-2" disabled={send.isPending || disconnect.isPending} onClick={() => disconnect.mutate()}>断开钱包</button>
    </>}
    {send.data && <a className="block text-sm underline" href={explorerUrl(send.data)} target="_blank" rel="noreferrer">查看提交的交易（不代表已入账）</a>}
    {attempted && !send.isPending && order.status === "awaiting_payment" && <div className="space-y-2 text-sm" role="status">
      <p>{send.isError ? "签名被拒绝、余额不足或网络响应失败。" : "已发起过付款。"}请先刷新订单并核查钱包；为防止重复付款，不自动重发。</p>
      <button className="payment-button" onClick={() => { sessionStorage.removeItem(`payment-attempt:${order.id}`); setAttempted(false); send.reset(); }}>已确认未广播，允许手动重试</button>
    </div>}
  </section>;
}
