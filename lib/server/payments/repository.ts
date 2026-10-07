import { z } from "zod";

import { orderSchema, type PaymentOrder } from "@/lib/payments/contracts";
import type { VerifiedTransfer } from "@/lib/payments/verify";

import type { Database } from "./database";

const projection = `id, tenant_id AS "tenantId", network, reference, recipient, recipient_ata AS "recipientAta", mint, amount_atomic::text AS "amountAtomic", credits, price_version AS "priceVersion", to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt", to_char(expires_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "expiresAt", status, signature`;
export class PaymentRepository {
  constructor(readonly db: Database) {}
  async create(order: PaymentOrder, key: string): Promise<PaymentOrder> {
    await this.db.query(`INSERT INTO payment_orders (id,tenant_id,network,reference,recipient,recipient_ata,mint,amount_atomic,credits,price_version,created_at,expires_at,status,idempotency_key) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) ON CONFLICT (tenant_id,idempotency_key) DO NOTHING`, [order.id, order.tenantId, order.network, order.reference, order.recipient, order.recipientAta, order.mint, order.amountAtomic, order.credits, order.priceVersion, order.createdAt, order.expiresAt, order.status, key]);
    const result = await this.db.query(`SELECT ${projection} FROM payment_orders WHERE tenant_id=$1 AND idempotency_key=$2`, [order.tenantId, key]);
    const saved = orderSchema.parse(result.rows[0]);
    if (saved.credits !== order.credits) throw new Error("Idempotency key conflicts with previous quote");
    return saved;
  }
  async get(id: string, tenant: string) {
    const { rows } = await this.db.query(`SELECT ${projection} FROM payment_orders WHERE id=$1 AND tenant_id=$2`, [id, tenant]);
    return rows[0] ? orderSchema.parse(rows[0]) : null;
  }
  async list(tenant: string) {
    const { rows } = await this.db.query(`SELECT ${projection} FROM payment_orders WHERE tenant_id=$1 ORDER BY created_at DESC LIMIT 50`, [tenant]);
    return rows.map((r) => orderSchema.parse(r));
  }
  async pending() {
    const { rows } = await this.db.query(`SELECT ${projection} FROM payment_orders WHERE status <> 'credited' ORDER BY last_checked_at NULLS FIRST, created_at LIMIT 50`);
    return rows.map((r) => orderSchema.parse(r));
  }
  async record(id: string, signature: string, result: string) {
    await this.db.query(`INSERT INTO payment_candidates(order_id,signature,result) VALUES ($1,$2,$3) ON CONFLICT(order_id,signature) DO UPDATE SET result=$3, checked_at=now()`, [id, signature, result]);
  }
  async mark(id: string, status: "confirmed" | "expired" | "review_required") {
    await this.db.query(`UPDATE payment_orders SET status=$2 WHERE id=$1 AND status <> 'credited'`, [id, status]);
  }
  async checked(id: string) { await this.db.query("UPDATE payment_orders SET last_checked_at=now() WHERE id=$1", [id]); }
  async settle(order: PaymentOrder, transfer: VerifiedTransfer) {
    return this.db.transaction(async (sql) => {
      const { rows } = await sql.query(`SELECT ${projection} FROM payment_orders WHERE id=$1 AND tenant_id=$2 FOR UPDATE`, [order.id, order.tenantId]);
      const locked = orderSchema.parse(rows[0]);
      if (locked.status === "credited") return;
      // Quote fields are immutable; service never takes a quote from the browser.
      await sql.query(`INSERT INTO payment_transfers(network,signature,position,order_id,chain_time) VALUES ($1,$2,$3,$4,to_timestamp($5))`, [locked.network, transfer.signature, transfer.position, locked.id, transfer.blockTime]);
      await sql.query(`INSERT INTO test_credit_ledger(order_id,tenant_id,credits,signature) VALUES ($1,$2,$3,$4)`, [locked.id, locked.tenantId, locked.credits, transfer.signature]);
      await sql.query(`UPDATE payment_orders SET status='credited',signature=$2 WHERE id=$1`, [locked.id, transfer.signature]);
    });
  }
  async billing(tenant: string) {
    const { rows } = await this.db.query(`SELECT order_id AS "orderId", credits, signature, to_char(created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt", to_char(expires_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "expiresAt" FROM test_credit_ledger WHERE tenant_id=$1 ORDER BY created_at DESC LIMIT 100`, [tenant]);
    const total = await this.db.query(`SELECT COALESCE(sum(credits),0)::text AS total FROM test_credit_ledger WHERE tenant_id=$1 AND expires_at>now()`, [tenant]);
    return { tenantId: tenant, availableCredits: Number(z.string().parse(total.rows[0]?.total)), orders: await this.list(tenant), ledger: rows };
  }
}
