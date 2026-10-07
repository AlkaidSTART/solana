CREATE TABLE IF NOT EXISTS payment_sessions (
  token_hash text PRIMARY KEY, tenant_id uuid NOT NULL, expires_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS payment_orders (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL, idempotency_key uuid NOT NULL,
  network text NOT NULL CHECK (network = 'devnet'), reference text NOT NULL UNIQUE,
  recipient text NOT NULL, recipient_ata text NOT NULL, mint text NOT NULL,
  amount_atomic bigint NOT NULL CHECK (amount_atomic > 0), credits integer NOT NULL CHECK (credits BETWEEN 100 AND 100000),
  price_version text NOT NULL, created_at timestamptz NOT NULL, expires_at timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('awaiting_payment','confirmed','credited','expired')),
  signature text, last_checked_at timestamptz,
  UNIQUE (tenant_id, idempotency_key)
);
CREATE TABLE IF NOT EXISTS payment_candidates (
  order_id uuid NOT NULL REFERENCES payment_orders(id), signature text NOT NULL,
  result text NOT NULL, checked_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (order_id, signature)
);
CREATE TABLE IF NOT EXISTS payment_transfers (
  network text NOT NULL CHECK (network = 'devnet'), signature text NOT NULL, position integer NOT NULL,
  order_id uuid NOT NULL UNIQUE REFERENCES payment_orders(id), chain_time timestamptz NOT NULL,
  PRIMARY KEY (network, signature, position)
);
CREATE TABLE IF NOT EXISTS test_credit_ledger (
  order_id uuid PRIMARY KEY REFERENCES payment_orders(id), tenant_id uuid NOT NULL,
  credits integer NOT NULL CHECK (credits > 0), signature text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL DEFAULT (now() + interval '12 months')
);
CREATE INDEX IF NOT EXISTS payment_scan_idx ON payment_orders(last_checked_at) WHERE status <> 'credited';
CREATE INDEX IF NOT EXISTS payment_tenant_idx ON payment_orders(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS test_credit_tenant_idx ON test_credit_ledger(tenant_id);

-- Upgrade the isolated Devnet schema without deleting orders or financial evidence.
ALTER TABLE payment_orders DROP CONSTRAINT IF EXISTS payment_orders_status_check;
ALTER TABLE payment_orders ADD CONSTRAINT payment_orders_status_check
  CHECK (status IN ('awaiting_payment','confirmed','credited','expired','review_required'));
