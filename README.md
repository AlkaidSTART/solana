This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## SolaFlow AI

本仓库采用 Next.js 16 App Router 全栈架构。页面与 `app/api/v1/**/route.ts` 位于同一应用，服务端领域逻辑统一放在 `lib/server/**`；不建立独立后端工程。

- [产品需求文档](docs/PRD.md)
- [Next.js 全栈 API 接口契约](docs/API.md)
- [WhatsApp 接入指南](docs/whatsapp-integration-guide.md)
- [UI 设计规范索引](ui_design/README.md)

当前业务 API 仍处于文档规划阶段。文档中的接口、外部连接、消息状态和支付状态不代表已经实现或通过真实验收。

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
