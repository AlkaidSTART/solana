CREATE TABLE stores (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  name text NOT NULL,
  platform text NOT NULL CHECK (platform = 'woocommerce'),
  base_url text NOT NULL,
  timezone text NOT NULL,
  support_hours jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'disabled')),
  connection_status text NOT NULL DEFAULT 'unconfigured'
    CHECK (connection_status IN ('unconfigured', 'pending', 'verified', 'failed')),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  credential_version integer NOT NULL DEFAULT 0 CHECK (credential_version >= 0),
  verified_at timestamptz,
  created_by_user_id text REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT stores_tenant_id_unique UNIQUE (tenant_id, id),
  CONSTRAINT stores_tenant_platform_url_unique UNIQUE (tenant_id, platform, base_url)
);
CREATE INDEX stores_tenant_status_created_idx ON stores (tenant_id, status, created_at DESC, id DESC);

ALTER TABLE store_grants
  ADD CONSTRAINT store_grants_store_tenant_fk
  FOREIGN KEY (tenant_id, store_id) REFERENCES stores (tenant_id, id) ON DELETE CASCADE;

CREATE TABLE integration_credentials (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  store_id text NOT NULL,
  credential_version integer NOT NULL CHECK (credential_version > 0),
  consumer_key_ciphertext text NOT NULL,
  consumer_secret_ciphertext text NOT NULL,
  webhook_secret_ciphertext text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  CONSTRAINT integration_credentials_store_fk
    FOREIGN KEY (tenant_id, store_id) REFERENCES stores (tenant_id, id) ON DELETE RESTRICT,
  CONSTRAINT integration_credentials_store_version_unique UNIQUE (store_id, credential_version)
);
CREATE INDEX integration_credentials_active_idx
  ON integration_credentials (tenant_id, store_id, credential_version DESC)
  WHERE revoked_at IS NULL;

CREATE TABLE woo_webhook_endpoints (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  store_id text NOT NULL,
  endpoint_id_hash text NOT NULL UNIQUE,
  credential_version integer NOT NULL DEFAULT 0 CHECK (credential_version >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  CONSTRAINT woo_webhook_endpoints_store_fk
    FOREIGN KEY (tenant_id, store_id) REFERENCES stores (tenant_id, id) ON DELETE RESTRICT
);
CREATE INDEX woo_webhook_endpoints_active_idx
  ON woo_webhook_endpoints (endpoint_id_hash, credential_version)
  WHERE revoked_at IS NULL;

CREATE TABLE woocommerce_webhook_events (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  store_id text NOT NULL,
  delivery_id text NOT NULL,
  topic text NOT NULL,
  provider_event text,
  external_order_id text,
  normalized_status text,
  event_types jsonb NOT NULL DEFAULT '[]'::jsonb,
  payload_digest text NOT NULL CHECK (payload_digest ~ '^[a-f0-9]{64}$'),
  occurred_at timestamptz,
  received_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT woocommerce_webhook_events_store_fk
    FOREIGN KEY (tenant_id, store_id) REFERENCES stores (tenant_id, id) ON DELETE RESTRICT,
  CONSTRAINT woocommerce_webhook_events_delivery_unique UNIQUE (store_id, delivery_id)
);
CREATE INDEX woocommerce_webhook_events_tenant_time_idx
  ON woocommerce_webhook_events (tenant_id, store_id, received_at DESC);
