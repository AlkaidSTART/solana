CREATE TABLE billing_network_configs (
  id text PRIMARY KEY,
  environment text NOT NULL CHECK (environment IN ('development', 'test', 'production')),
  config_version text NOT NULL,
  cluster text NOT NULL CHECK (cluster IN ('devnet', 'mainnet-beta')),
  genesis_hash text NOT NULL,
  mint text NOT NULL,
  token_program text NOT NULL,
  decimals smallint NOT NULL CHECK (decimals = 6),
  recipient text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'retired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  retired_at timestamptz,
  CONSTRAINT billing_network_configs_version_unique UNIQUE (environment, config_version),
  CONSTRAINT billing_network_configs_environment_id_unique UNIQUE (environment, id),
  CONSTRAINT billing_network_configs_snapshot_unique UNIQUE (
    environment, id, cluster, genesis_hash, mint, token_program, recipient, decimals
  )
);
CREATE UNIQUE INDEX billing_network_configs_active_unique
  ON billing_network_configs (environment) WHERE status = 'active';

CREATE TABLE payment_orders (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  environment text NOT NULL CHECK (environment IN ('development', 'test', 'production')),
  purpose text NOT NULL CHECK (purpose = 'credits_topup'),
  catalog_version text NOT NULL,
  network_config_id text NOT NULL,
  credits bigint NOT NULL CHECK (credits > 0),
  unit_price_minor numeric(78, 0) NOT NULL CHECK (unit_price_minor > 0),
  amount_minor numeric(78, 0) NOT NULL CHECK (amount_minor > 0),
  currency text NOT NULL CHECK (currency = 'USDC'),
  decimals smallint NOT NULL CHECK (decimals = 6),
  cluster text NOT NULL CHECK (cluster IN ('devnet', 'mainnet-beta')),
  genesis_hash text NOT NULL,
  mint text NOT NULL,
  token_program text NOT NULL,
  recipient text NOT NULL,
  reference text NOT NULL,
  solana_pay_url text NOT NULL,
  status text NOT NULL DEFAULT 'awaiting_payment'
    CHECK (status IN ('awaiting_payment', 'candidate_observed', 'awaiting_finalization', 'settled', 'review_required', 'expired', 'cancelled')),
  quote_snapshot jsonb NOT NULL CHECK (jsonb_typeof(quote_snapshot) = 'object'),
  requested_by_user_id text REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  settled_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payment_orders_network_config_fk FOREIGN KEY (
    environment, network_config_id, cluster, genesis_hash, mint, token_program, recipient, decimals
  ) REFERENCES billing_network_configs (
    environment, id, cluster, genesis_hash, mint, token_program, recipient, decimals
  ) ON DELETE RESTRICT,
  CONSTRAINT payment_orders_tenant_id_unique UNIQUE (tenant_id, id),
  CONSTRAINT payment_orders_reference_unique UNIQUE (environment, cluster, reference),
  CONSTRAINT payment_orders_quote_window CHECK (expires_at > created_at),
  CONSTRAINT payment_orders_settled_time CHECK ((status = 'settled') = (settled_at IS NOT NULL))
);
CREATE INDEX payment_orders_tenant_time_idx ON payment_orders (tenant_id, created_at DESC, id DESC);
CREATE INDEX payment_orders_pending_idx ON payment_orders (environment, cluster, expires_at)
  WHERE status IN ('awaiting_payment', 'candidate_observed', 'awaiting_finalization');

CREATE FUNCTION enforce_payment_order_settlement_monotonicity() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'settled' AND NEW.status <> 'settled' THEN
    RAISE EXCEPTION 'settled_payment_order_is_immutable';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER payment_orders_settlement_before_update
  BEFORE UPDATE ON payment_orders FOR EACH ROW EXECUTE FUNCTION enforce_payment_order_settlement_monotonicity();

CREATE TABLE payment_candidates (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  payment_order_id text NOT NULL,
  environment text NOT NULL CHECK (environment IN ('development', 'test', 'production')),
  cluster text NOT NULL CHECK (cluster IN ('devnet', 'mainnet-beta')),
  signature text NOT NULL,
  transfer_index integer CHECK (transfer_index >= 0),
  status text NOT NULL DEFAULT 'observed'
    CHECK (status IN ('observed', 'queued', 'checking', 'confirmed', 'finalized', 'review_required', 'unknown')),
  commitment text CHECK (commitment IN ('processed', 'confirmed', 'finalized')),
  review_code text,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(evidence) = 'object'),
  block_time timestamptz,
  observed_at timestamptz NOT NULL DEFAULT now(),
  checked_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payment_candidates_order_fk FOREIGN KEY (tenant_id, payment_order_id)
    REFERENCES payment_orders (tenant_id, id) ON DELETE RESTRICT,
  CONSTRAINT payment_candidates_tenant_id_unique UNIQUE (tenant_id, id),
  CONSTRAINT payment_candidates_order_signature_unique UNIQUE (payment_order_id, cluster, signature)
);
CREATE INDEX payment_candidates_check_idx ON payment_candidates (environment, cluster, status, observed_at)
  WHERE status IN ('observed', 'queued', 'checking', 'confirmed', 'unknown');

CREATE TABLE settled_solana_transfers (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  payment_order_id text NOT NULL,
  candidate_id text NOT NULL,
  environment text NOT NULL CHECK (environment IN ('development', 'test', 'production')),
  cluster text NOT NULL CHECK (cluster IN ('devnet', 'mainnet-beta')),
  signature text NOT NULL,
  transfer_index integer NOT NULL CHECK (transfer_index >= 0),
  genesis_hash text NOT NULL,
  mint text NOT NULL,
  token_program text NOT NULL,
  recipient text NOT NULL,
  reference text NOT NULL,
  amount_minor numeric(78, 0) NOT NULL CHECK (amount_minor > 0),
  slot numeric(20, 0),
  block_time timestamptz NOT NULL,
  finalized_evidence jsonb NOT NULL CHECK (jsonb_typeof(finalized_evidence) = 'object'),
  settled_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT settled_solana_transfers_order_fk FOREIGN KEY (tenant_id, payment_order_id)
    REFERENCES payment_orders (tenant_id, id) ON DELETE RESTRICT,
  CONSTRAINT settled_solana_transfers_candidate_fk FOREIGN KEY (tenant_id, candidate_id)
    REFERENCES payment_candidates (tenant_id, id) ON DELETE RESTRICT,
  CONSTRAINT settled_solana_transfers_identity_unique UNIQUE (cluster, signature, transfer_index),
  CONSTRAINT settled_solana_transfers_order_unique UNIQUE (payment_order_id)
);
CREATE INDEX settled_solana_transfers_tenant_time_idx
  ON settled_solana_transfers (tenant_id, settled_at DESC);

CREATE TABLE credit_batches (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  environment text NOT NULL CHECK (environment IN ('development', 'test', 'production')),
  source_type text NOT NULL CHECK (source_type IN ('payment', 'trial', 'subscription', 'compensation')),
  source_payment_order_id text,
  granted bigint NOT NULL CHECK (granted > 0),
  available bigint NOT NULL CHECK (available >= 0),
  reserved bigint NOT NULL DEFAULT 0 CHECK (reserved >= 0),
  consumed bigint NOT NULL DEFAULT 0 CHECK (consumed >= 0),
  expired bigint NOT NULL DEFAULT 0 CHECK (expired >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  CONSTRAINT credit_batches_balance_check CHECK (available + reserved + consumed + expired = granted),
  CONSTRAINT credit_batches_payment_order_fk FOREIGN KEY (tenant_id, source_payment_order_id)
    REFERENCES payment_orders (tenant_id, id) ON DELETE RESTRICT,
  CONSTRAINT credit_batches_payment_source_unique UNIQUE (source_payment_order_id),
  CONSTRAINT credit_batches_tenant_id_unique UNIQUE (tenant_id, id)
);
CREATE INDEX credit_batches_available_idx ON credit_batches (tenant_id, environment, expires_at)
  WHERE available > 0;

CREATE TABLE credit_ledger (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  environment text NOT NULL CHECK (environment IN ('development', 'test', 'production')),
  batch_id text NOT NULL,
  payment_order_id text,
  entry_type text NOT NULL CHECK (entry_type IN ('grant', 'reserve', 'release', 'consume', 'expire', 'compensate', 'refund_freeze', 'refund_release')),
  bucket text NOT NULL CHECK (bucket IN ('available', 'reserved', 'consumed', 'expired', 'frozen')),
  delta bigint NOT NULL CHECK (delta <> 0),
  reason_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT credit_ledger_batch_fk FOREIGN KEY (tenant_id, batch_id)
    REFERENCES credit_batches (tenant_id, id) ON DELETE RESTRICT,
  CONSTRAINT credit_ledger_payment_order_fk FOREIGN KEY (tenant_id, payment_order_id)
    REFERENCES payment_orders (tenant_id, id) ON DELETE RESTRICT,
  CONSTRAINT credit_ledger_reason_unique UNIQUE (tenant_id, environment, reason_key)
);
CREATE INDEX credit_ledger_tenant_time_idx ON credit_ledger (tenant_id, environment, created_at DESC, id DESC);

CREATE FUNCTION reject_credit_ledger_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'credit_ledger_is_immutable';
END;
$$;
CREATE TRIGGER credit_ledger_immutable_before_update_or_delete
  BEFORE UPDATE OR DELETE ON credit_ledger FOR EACH ROW EXECUTE FUNCTION reject_credit_ledger_mutation();

CREATE TABLE billing_subscriptions (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  environment text NOT NULL CHECK (environment IN ('development', 'test', 'production')),
  plan_id text NOT NULL,
  price_version text NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'expired', 'cancelled')),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  source_payment_order_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT billing_subscriptions_window CHECK (ends_at > starts_at),
  CONSTRAINT billing_subscriptions_payment_fk FOREIGN KEY (tenant_id, source_payment_order_id)
    REFERENCES payment_orders (tenant_id, id) ON DELETE RESTRICT,
  CONSTRAINT billing_subscriptions_payment_unique UNIQUE (source_payment_order_id)
);
CREATE INDEX billing_subscriptions_current_idx ON billing_subscriptions (tenant_id, environment, ends_at DESC);

CREATE TABLE refund_requests (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  payment_order_id text NOT NULL,
  environment text NOT NULL CHECK (environment IN ('development', 'test', 'production')),
  status text NOT NULL DEFAULT 'manual_pending'
    CHECK (status IN ('manual_pending', 'under_review', 'approved', 'rejected', 'completed', 'cancelled')),
  reason_code text NOT NULL,
  frozen_credits bigint NOT NULL CHECK (frozen_credits >= 0),
  requested_by_user_id text REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT refund_requests_order_fk FOREIGN KEY (tenant_id, payment_order_id)
    REFERENCES payment_orders (tenant_id, id) ON DELETE RESTRICT
);
CREATE INDEX refund_requests_tenant_time_idx ON refund_requests (tenant_id, created_at DESC);
