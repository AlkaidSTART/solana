"use client";

import dynamic from "next/dynamic";

// Wallet and tab-local recovery storage are browser-only.
const Panel = dynamic(() => import("./sol-test-panel").then((module) => module.SolTestPanel), {
  ssr: false, loading: () => <p role="status">正在载入 SOL 测试付款…</p>,
});
export function SolTestEntry() { return <Panel />; }
