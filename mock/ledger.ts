import type { LedgerTransaction } from "@/stores/use-app-store";

export const MOCK_LEDGER_HISTORY: LedgerTransaction[] = [
  {
    id: "tx_01",
    type: "TOPUP_USDC",
    amountUsdc: "100.00 USDC",
    creditsDelta: 11000,
    balanceAfter: 8420,
    solanaTx: "4zHHs...9vKp1 (Solana Devnet)",
    timestamp: "2026-10-05 16:32 WIB",
    description: "Solana Pay 快捷充值 (Growth 优惠档位)",
  },
  {
    id: "tx_02",
    type: "CONSUMPTION",
    creditsDelta: -580,
    balanceAfter: 7840,
    timestamp: "2026-10-06 23:59 WIB",
    description: "每日 WhatsApp 智能交互与自动化消息结算",
  },
  {
    id: "tx_03",
    type: "TRIAL_GRANT",
    creditsDelta: 100,
    balanceAfter: 100,
    timestamp: "2026-10-01 10:00 WIB",
    description: "商户入驻 6 步激活向导赠送试用额度",
  },
];
