import { beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";

import { testAddress } from "@/tests/support/payment-fixtures";
import { assertOrigin, PaymentHttpError, paymentResponse, readBody } from "./http";

beforeAll(() => {
  process.env.PAYMENTS_DEVNET_ENABLED = "true";
  process.env.DATABASE_URL = "postgres://postgres:postgres@localhost:5432/test";
  process.env.SOLANA_RECIPIENT = testAddress(5);
  process.env.PAYMENT_APP_ORIGIN = "http://localhost:3000";
});

describe("Payment HTTP utilities", () => {
  describe("assertOrigin", () => {
    it("accepts request with matching origin", () => {
      const request = new Request("http://localhost:3000/api/payments", {
        headers: { origin: "http://localhost:3000" },
      });
      expect(() => assertOrigin(request)).not.toThrow();
    });

    it("rejects mismatched origin with 403", () => {
      const request = new Request("http://localhost:3000/api/payments", {
        headers: { origin: "https://evil-phishing-site.com" },
      });
      expect(() => assertOrigin(request)).toThrow(PaymentHttpError);
      try {
        assertOrigin(request);
      } catch (err) {
        expect((err as PaymentHttpError).status).toBe(403);
      }
    });

    it("rejects missing origin header with 403", () => {
      const request = new Request("http://localhost:3000/api/payments");
      expect(() => assertOrigin(request)).toThrow(PaymentHttpError);
    });
  });

  describe("readBody", () => {
    it("rejects missing or invalid content-type with 415", async () => {
      const request = new Request("http://localhost:3000/api/payments", {
        method: "POST",
        headers: { "content-type": "text/plain" },
        body: "hello",
      });
      await expect(readBody(request)).rejects.toMatchObject({ status: 415 });
    });

    it("rejects oversized request body with 413 (>2048 bytes)", async () => {
      const largePayload = JSON.stringify({ padding: "a".repeat(2100) });
      const request = new Request("http://localhost:3000/api/payments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: largePayload,
      });
      await expect(readBody(request)).rejects.toMatchObject({ status: 413 });
    });

    it("rejects malformed JSON syntax with 400", async () => {
      const request = new Request("http://localhost:3000/api/payments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{ bad json: ",
      });
      await expect(readBody(request)).rejects.toMatchObject({ status: 400 });
    });

    it("parses valid JSON successfully", async () => {
      const request = new Request("http://localhost:3000/api/payments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ credits: 100 }),
      });
      const data = await readBody(request);
      expect(data).toEqual({ credits: 100 });
    });
  });

  describe("paymentResponse", () => {
    it("returns 200 with no-store cache control on success", async () => {
      const response = await paymentResponse(async () => ({ ok: true }));
      expect(response.status).toBe(200);
      expect(response.headers.get("Cache-Control")).toBe("no-store");
      expect(await response.json()).toEqual({ ok: true });
    });

    it("maps PaymentHttpError to exact status and message", async () => {
      const response = await paymentResponse(async () => {
        throw new PaymentHttpError(403, "自定义拒绝原因");
      });
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({ error: "自定义拒绝原因" });
    });

    it("maps ZodError to 400 bad request", async () => {
      const response = await paymentResponse(async () => {
        z.object({ credits: z.number().int().min(100) }).parse({ credits: 50 });
      });
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        error: "输入或服务端配置不符合要求",
      });
    });

    it("maps unexpected errors to 503 fail-closed message without leaking trace", async () => {
      const response = await paymentResponse(async () => {
        throw new Error("Sensitive database connection failure: postgres://secret@db");
      });
      expect(response.status).toBe(503);
      const json = await response.json();
      expect(json.error).toContain("支付服务暂不可用");
      expect(json.error).not.toContain("secret");
    });
  });
});
