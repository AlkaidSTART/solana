CREATE TABLE users (
  id text PRIMARY KEY,
  email text NOT NULL,
  email_hash text NOT NULL UNIQUE,
  locale text NOT NULL DEFAULT 'en',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  disabled_at timestamptz
);

CREATE TABLE otp_challenges (
  id text PRIMARY KEY,
  email_hash text NOT NULL,
  email_ciphertext text NOT NULL,
  idempotency_key text NOT NULL,
  request_digest text NOT NULL,
  code_digest text NOT NULL,
  locale text NOT NULL,
  delivery_status text NOT NULL DEFAULT 'pending'
    CHECK (delivery_status IN ('pending', 'sent', 'failed', 'unknown')),
  delivery_attempt_count integer NOT NULL DEFAULT 0 CHECK (delivery_attempt_count >= 0),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  last_delivery_attempt_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT otp_challenges_email_idempotency_unique UNIQUE (email_hash, idempotency_key)
);
CREATE INDEX otp_challenges_email_expiry_idx ON otp_challenges (email_hash, expires_at DESC);
CREATE INDEX otp_challenges_delivery_idx ON otp_challenges (delivery_status, created_at)
  WHERE delivery_status IN ('pending', 'unknown');

CREATE TABLE rate_limit_buckets (
  scope text NOT NULL,
  key_hash text NOT NULL,
  window_started_at timestamptz NOT NULL,
  request_count integer NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  blocked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (scope, key_hash)
);

CREATE TABLE tenants (
  id text PRIMARY KEY,
  name text NOT NULL,
  market text NOT NULL,
  timezone text NOT NULL,
  support_hours jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleting', 'deleted')),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE memberships (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  user_id text NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'agent', 'finance')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('invited', 'active', 'revoked')),
  invited_at timestamptz,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT memberships_tenant_user_unique UNIQUE (tenant_id, user_id),
  CONSTRAINT memberships_tenant_id_unique UNIQUE (tenant_id, id),
  CONSTRAINT memberships_tenant_id_user_unique UNIQUE (tenant_id, id, user_id)
);
CREATE INDEX memberships_user_status_idx ON memberships (user_id, status, tenant_id);
CREATE INDEX memberships_tenant_role_idx ON memberships (tenant_id, role, status);

CREATE TABLE sessions (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  tenant_id text REFERENCES tenants(id) ON DELETE RESTRICT,
  membership_id text,
  csrf_token_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  CONSTRAINT sessions_membership_tenant_user_fk FOREIGN KEY (tenant_id, membership_id, user_id)
    REFERENCES memberships (tenant_id, id, user_id) ON DELETE RESTRICT,
  CONSTRAINT sessions_tenant_membership_pair CHECK ((tenant_id IS NULL) = (membership_id IS NULL))
);
CREATE INDEX sessions_user_active_idx ON sessions (user_id, expires_at DESC) WHERE revoked_at IS NULL;
CREATE INDEX sessions_tenant_active_idx ON sessions (tenant_id, expires_at DESC) WHERE revoked_at IS NULL;

CREATE TABLE store_grants (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  membership_id text NOT NULL,
  store_id text NOT NULL,
  granted_by_membership_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  CONSTRAINT store_grants_membership_tenant_fk FOREIGN KEY (tenant_id, membership_id)
    REFERENCES memberships (tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT store_grants_granted_by_tenant_fk FOREIGN KEY (tenant_id, granted_by_membership_id)
    REFERENCES memberships (tenant_id, id) ON DELETE RESTRICT,
  CONSTRAINT store_grants_unique UNIQUE (tenant_id, membership_id, store_id)
);
CREATE INDEX store_grants_membership_active_idx ON store_grants (tenant_id, membership_id, store_id)
  WHERE revoked_at IS NULL;

CREATE TABLE idempotency_records (
  id text PRIMARY KEY,
  tenant_id text REFERENCES tenants(id) ON DELETE RESTRICT,
  actor_user_id text REFERENCES users(id) ON DELETE RESTRICT,
  operation text NOT NULL,
  idempotency_key text NOT NULL,
  payload_digest text NOT NULL,
  state text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending', 'completed', 'failed')),
  response_status integer CHECK (response_status BETWEEN 100 AND 599),
  response_body jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  CONSTRAINT idempotency_records_scope_pair CHECK (tenant_id IS NOT NULL OR actor_user_id IS NOT NULL)
);
CREATE UNIQUE INDEX idempotency_records_scope_key_unique ON idempotency_records
  (coalesce(tenant_id, ''), coalesce(actor_user_id, ''), operation, idempotency_key);
CREATE INDEX idempotency_records_expiry_idx ON idempotency_records (expires_at);

CREATE TABLE audit_events (
  id text PRIMARY KEY,
  tenant_id text REFERENCES tenants(id) ON DELETE RESTRICT,
  actor_user_id text REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text,
  resource_id text,
  request_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_events_tenant_time_idx ON audit_events (tenant_id, created_at DESC);
CREATE INDEX audit_events_actor_time_idx ON audit_events (actor_user_id, created_at DESC);
CREATE INDEX audit_events_resource_idx ON audit_events (tenant_id, resource_type, resource_id, created_at DESC);

CREATE TABLE operations (
  id text PRIMARY KEY,
  tenant_id text REFERENCES tenants(id) ON DELETE RESTRICT,
  requested_by_user_id text REFERENCES users(id) ON DELETE SET NULL,
  operation_type text NOT NULL,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
  progress integer CHECK (progress BETWEEN 0 AND 100),
  input jsonb NOT NULL DEFAULT '{}'::jsonb,
  result jsonb,
  error_code text,
  claimed_by text,
  lease_expires_at timestamptz,
  heartbeat_at timestamptz,
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX operations_tenant_status_time_idx ON operations (tenant_id, status, created_at DESC);
CREATE INDEX operations_requester_time_idx ON operations (requested_by_user_id, created_at DESC);
CREATE INDEX operations_lease_idx ON operations (lease_expires_at) WHERE status = 'running';

CREATE TABLE outbox_events (
  id text PRIMARY KEY,
  deduplication_key text NOT NULL UNIQUE,
  tenant_id text REFERENCES tenants(id) ON DELETE RESTRICT,
  event_type text NOT NULL,
  aggregate_type text NOT NULL,
  aggregate_id text NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'published', 'failed')),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  available_at timestamptz NOT NULL DEFAULT now(),
  locked_at timestamptz,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX outbox_events_ready_idx ON outbox_events (available_at, created_at)
  WHERE status IN ('pending', 'failed');
CREATE INDEX outbox_events_tenant_time_idx ON outbox_events (tenant_id, created_at DESC);

CREATE FUNCTION enforce_active_tenant_owner() RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  tenant_ids text[];
  tenant_to_check text;
BEGIN
  IF TG_TABLE_NAME = 'tenants' THEN
    IF TG_OP = 'DELETE' THEN
      RETURN NULL;
    END IF;
    tenant_ids := ARRAY[NEW.id];
  ELSIF TG_OP = 'INSERT' THEN
    tenant_ids := ARRAY[NEW.tenant_id];
  ELSIF TG_OP = 'DELETE' THEN
    tenant_ids := ARRAY[OLD.tenant_id];
  ELSE
    tenant_ids := ARRAY[OLD.tenant_id, NEW.tenant_id];
  END IF;

  FOREACH tenant_to_check IN ARRAY tenant_ids LOOP
    IF EXISTS (
      SELECT 1 FROM tenants
      WHERE id = tenant_to_check AND status = 'active'
    ) AND NOT EXISTS (
      SELECT 1 FROM memberships
      WHERE tenant_id = tenant_to_check
        AND role = 'owner'
        AND status = 'active'
        AND revoked_at IS NULL
    ) THEN
      RAISE EXCEPTION 'Active tenant must have at least one active owner'
        USING ERRCODE = '23514', CONSTRAINT = 'active_tenant_requires_owner';
    END IF;
  END LOOP;

  RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER tenants_require_owner
AFTER INSERT OR UPDATE ON tenants
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION enforce_active_tenant_owner();

CREATE CONSTRAINT TRIGGER memberships_preserve_tenant_owner
AFTER INSERT OR UPDATE OR DELETE ON memberships
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION enforce_active_tenant_owner();
