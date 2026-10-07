import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SolaFlow AI · 东南亚电商 WhatsApp 智能订单系统",
  description: "面向东南亚跨境与本土电商的 WhatsApp 智能外呼、COD 核单与弃购挽回系统",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
