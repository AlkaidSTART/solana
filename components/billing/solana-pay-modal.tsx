"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/stores/use-app-store";
import { CheckCircle2, QrCode, ArrowUpRight, Loader2, Sparkles } from "lucide-react";
import { clsx } from "clsx";

interface SolanaPayModalProps {
  open: boolean;
  onClose: () => void;
}

export const SolanaPayModal: React.FC<SolanaPayModalProps> = ({ open, onClose }) => {
  const { topupCredits } = useAppStore();
  const [selectedTier, setSelectedTier] = useState<number>(100);
  const [status, setStatus] = useState<"IDLE" | "PROCESSING" | "FINALIZED">("IDLE");
  const [txHash, setTxHash] = useState<string>("");

  const tiers = [
    { usdc: 25, credits: 2500, label: "Starter", bonus: "基准费率" },
    { usdc: 100, credits: 11000, label: "Growth", bonus: "+10% 赠送" },
    { usdc: 500, credits: 60000, label: "Enterprise", bonus: "+20% 赠送" },
  ];

  const currentTier = tiers.find((t) => t.usdc === selectedTier) || tiers[1];

  // 播放原生微触感提示音 (Web Audio API)
  const playTone = () => {
    try {
      const audioCtx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch {
      // AudioContext unavailable or blocked by policy
    }
  };

  const handleSimulatePayment = () => {
    setStatus("PROCESSING");
    const fakeHash = "4zHHs87fKk99Lpq1V788k918";

    setTimeout(() => {
      setStatus("FINALIZED");
      setTxHash(fakeHash);
      playTone();
      topupCredits(currentTier.usdc, currentTier.credits, fakeHash);
    }, 600);
  };

  const handleReset = () => {
    setStatus("IDLE");
    setTxHash("");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleReset}
      title="Solana Pay 毫秒级原生充值"
      subtitle="无需传统信用卡 3% 汇损 • Devnet 原生 USDC 极速到账 • 0.00025 手续费"
      width="lg"
    >
      {status === "FINALIZED" ? (
        <div className="py-6 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#059669]/10 text-[#059669] flex items-center justify-center border border-[#059669]/20">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <div>
            <h4 className="text-base font-mono uppercase font-bold text-[#09090B]">
              链上结算完成 (Finalized in 418ms)
            </h4>
            <p className="text-xs font-mono text-[#71717A] mt-1">
              成功充值 {currentTier.usdc} USDC，+{currentTier.credits.toLocaleString()} Credits 已即时入账！
            </p>
          </div>

          <div className="p-3 bg-[#FAFAFA] border border-[#E4E4E7] text-left text-xs font-mono max-w-md mx-auto space-y-1">
            <div className="flex justify-between text-[#71717A]">
              <span>Network:</span>
              <span className="text-[#09090B]">Solana Devnet (v1.1)</span>
            </div>
            <div className="flex justify-between text-[#71717A]">
              <span>Transaction Hash:</span>
              <span className="text-[#09090B] truncate max-w-[200px]">{txHash}</span>
            </div>
            <div className="flex justify-between text-[#71717A]">
              <span>L1 Gas Fee:</span>
              <span className="text-[#059669]">0.000005 SOL ($0.00025)</span>
            </div>
          </div>

          <div className="pt-2">
            <Button onClick={handleReset} className="w-full max-w-md">
              返回并查看 Credits 余额
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 档位选择 (发丝黑白) */}
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#71717A] mb-2">
              选择充值档位 (USDC 票据)
            </div>
            <div className="grid grid-cols-3 gap-3">
              {tiers.map((t) => {
                const isSelected = t.usdc === selectedTier;
                return (
                  <div
                    key={t.usdc}
                    onClick={() => setSelectedTier(t.usdc)}
                    className={clsx(
                      "p-3.5 border cursor-pointer transition-all flex flex-col justify-between",
                      isSelected
                        ? "bg-[#09090B] text-white border-[#09090B]"
                        : "bg-white text-[#09090B] border-[#E4E4E7] hover:border-[#09090B]"
                    )}
                  >
                    <div>
                      <div className="text-[10px] font-mono uppercase opacity-70">
                        {t.label}
                      </div>
                      <div className="text-lg font-mono font-bold mt-0.5">
                        ${t.usdc} USDC
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-current/20 flex flex-col text-[10px] font-mono">
                      <span>+{t.credits.toLocaleString()} 点</span>
                      <span className="opacity-75">{t.bonus}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 链上二维码与收款信息分屏 */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 p-4 border border-[#E4E4E7] bg-[#FAFAFA]">
            {/* 二维码示意 */}
            <div className="sm:col-span-4 flex flex-col items-center justify-center p-3 bg-white border border-[#E4E4E7]">
              <div className="w-32 h-32 border border-[#E4E4E7] bg-white flex flex-col items-center justify-center text-center p-2">
                <QrCode className="w-20 h-20 text-[#09090B]" />
                <span className="text-[9px] font-mono text-[#71717A] mt-1">
                  SOLANA PAY QR
                </span>
              </div>
            </div>

            {/* 收款参数 */}
            <div className="sm:col-span-8 flex flex-col justify-between space-y-2 text-xs font-mono">
              <div>
                <div className="text-[#71717A] text-[10px] uppercase">收款商户公钥 (Devnet Recipient)</div>
                <div className="text-[#09090B] font-semibold select-all mt-0.5 break-all">
                  SolaFlow9xUSDC882K19z88Kx198aa7Dev
                </div>
              </div>

              <div>
                <div className="text-[#71717A] text-[10px] uppercase">应付金额与代币标准</div>
                <div className="text-sm font-bold text-[#09090B]">
                  {currentTier.usdc}.00 USDC (SPL Token)
                </div>
              </div>

              <div className="pt-2 text-[10px] text-[#71717A] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#059669]" />
                <span>Phantom / Solflare 扫码或点击一键完成</span>
              </div>
            </div>
          </div>

          {/* 行动按钮 */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              onClick={handleSimulatePayment}
              disabled={status === "PROCESSING"}
              className="flex-1 h-11 text-xs"
            >
              {status === "PROCESSING" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  正在广播至 Solana Devnet...
                </>
              ) : (
                `立即在 Devnet 模拟付款 (${currentTier.usdc} USDC)`
              )}
            </Button>
            <Button variant="outline" onClick={onClose} className="h-11 text-xs">
              取消
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
