CREATE TABLE orders (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  store_id text NOT NULL,
  platform text NOT NULL CHECK (platform = 'woocommerce'),
  platform_order_id text NOT NULL,
  order_status text NOT NULL CHECK (order_status IN ('pending', 'processing', 'on-hold', 'completed', 'cancelled', 'refunded', 'failed', 'deleted')),
  payment_status text NOT NULL CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'unknown')),
  fulfillment_status text NOT NULL DEFAULT 'unfulfilled' CHECK (fulfillment_status IN ('unfulfilled', 'fulfilled', 'unknown')),
  is_cod boolean NOT NULL DEFAULT false,
  locale text,
  currency text,
  total_minor text,
  contact_id text,
  platform_created_at timestamptz NOT NULL,
  platform_updated_at timestamptz NOT NULL,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  summary jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(summary) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT orders_store_fk FOREIGN KEY (tenant_id, store_id)
    REFERENCES stores(tenant_id, id) ON DELETE RESTRICT,
  CONSTRAINT orders_contact_fk FOREIGN KEY (tenant_id, store_id, contact_id)
    REFERENCES contacts(tenant_id, store_id, id) ON DELETE RESTRICT,
  CONSTRAINT orders_store_platform_id_unique UNIQUE (tenant_id, store_id, platform, platform_order_id),
  CONSTRAINT orders_tenant_id_unique UNIQUE (tenant_id, id),
  CONSTRAINT orders_tenant_store_id_unique UNIQUE (tenant_id, store_id, id)
);
CREATE INDEX orders_store_created_idx ON orders (tenant_id, store_id, platform_created_at DESC, id DESC);
CREATE INDEX orders_tenant_payment_idx ON orders (tenant_id, payment_status, platform_created_at DESC);
CREATE INDEX orders_contact_idx ON orders (tenant_id, store_id, contact_id) WHERE contact_id IS NOT NULL;

CREATE FUNCTION enforce_order_state_monotonicity() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.payment_status = 'refunded' AND NEW.payment_status <> 'refunded' THEN
    RAISE EXCEPTION 'order_payment_state_regression';
  END IF;
  IF OLD.payment_status = 'paid' AND NEW.payment_status IN ('pending', 'failed', 'unknown') THEN
    RAISE EXCEPTION 'order_payment_state_regression';
  END IF;
  IF OLD.fulfillment_status = 'fulfilled' AND NEW.fulfillment_status <> 'fulfilled' THEN
    RAISE EXCEPTION 'order_fulfillment_state_regression';
  END IF;
  IF OLD.order_status IN ('cancelled', 'deleted') AND NEW.order_status NOT IN ('cancelled', 'deleted') THEN
    RAISE EXCEPTION 'order_status_regression';
  END IF;
  IF OLD.order_status = 'completed' AND NEW.order_status NOT IN ('completed', 'refunded', 'deleted') THEN
    RAISE EXCEPTION 'order_status_regression';
  END IF;
  IF OLD.order_status = 'refunded' AND NEW.order_status NOT IN ('refunded', 'deleted') THEN
    RAISE EXCEPTION 'order_status_regression';
  END IF;
  IF OLD.order_status = 'processing' AND NEW.order_status IN ('pending', 'on-hold') THEN
    RAISE EXCEPTION 'order_status_regression';
  END IF;
  NEW.version := OLD.version + 1;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER orders_monotonic_state_before_update
  BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION enforce_order_state_monotonicity();

CREATE TABLE order_events (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  store_id text NOT NULL,
  order_id text NOT NULL,
  event_key text NOT NULL,
  event_type text NOT NULL,
  event_at timestamptz NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  order_version integer NOT NULL CHECK (order_version > 0),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(payload) = 'object'),
  actor_user_id text REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT order_events_order_fk FOREIGN KEY (tenant_id, store_id, order_id)
    REFERENCES orders(tenant_id, store_id, id) ON DELETE RESTRICT,
  CONSTRAINT order_events_store_fk FOREIGN KEY (tenant_id, store_id)
    REFERENCES stores(tenant_id, id) ON DELETE RESTRICT,
  CONSTRAINT order_events_dedupe_unique UNIQUE (tenant_id, store_id, event_key)
);
CREATE INDEX order_events_timeline_idx ON order_events (tenant_id, order_id, event_at DESC, id DESC);

CREATE FUNCTION reject_order_event_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'order_events_are_immutable';
END;
$$;
CREATE TRIGGER order_events_immutable_before_update_or_delete
  BEFORE UPDATE OR DELETE ON order_events FOR EACH ROW EXECUTE FUNCTION reject_order_event_mutation();

CREATE TABLE workflows (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  store_id text NOT NULL,
  type text NOT NULL CHECK (type IN ('payment_reminder', 'cod_confirmation')),
  name text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'blocked')),
  current_version integer NOT NULL DEFAULT 1 CHECK (current_version > 0),
  active_version integer,
  created_by_user_id text NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT workflows_store_fk FOREIGN KEY (tenant_id, store_id)
    REFERENCES stores(tenant_id, id) ON DELETE RESTRICT,
  CONSTRAINT workflows_tenant_id_unique UNIQUE (tenant_id, id),
  CONSTRAINT workflows_tenant_id_store_unique UNIQUE (tenant_id, id, store_id),
  CONSTRAINT workflows_active_version_pair CHECK (status <> 'active' OR active_version IS NOT NULL)
);
CREATE INDEX workflows_tenant_store_status_idx ON workflows (tenant_id, store_id, status, created_at DESC);

CREATE TABLE workflow_versions (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  workflow_id text NOT NULL,
  version integer NOT NULL CHECK (version > 0),
  config jsonb NOT NULL CHECK (jsonb_typeof(config) = 'object'),
  readiness jsonb NOT NULL CHECK (jsonb_typeof(readiness) = 'object'),
  created_by_user_id text NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT workflow_versions_workflow_fk FOREIGN KEY (tenant_id, workflow_id)
    REFERENCES workflows(tenant_id, id) ON DELETE RESTRICT,
  CONSTRAINT workflow_versions_unique UNIQUE (tenant_id, workflow_id, version),
  CONSTRAINT workflow_versions_id_pair_unique UNIQUE (tenant_id, workflow_id, id)
);
ALTER TABLE workflows ADD CONSTRAINT workflows_current_version_fk
  FOREIGN KEY (tenant_id, id, current_version)
  REFERENCES workflow_versions(tenant_id, workflow_id, version)
  DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE workflows ADD CONSTRAINT workflows_active_version_fk
  FOREIGN KEY (tenant_id, id, active_version)
  REFERENCES workflow_versions(tenant_id, workflow_id, version)
  DEFERRABLE INITIALLY DEFERRED;
CREATE INDEX workflow_versions_history_idx ON workflow_versions (tenant_id, workflow_id, version DESC);

CREATE FUNCTION reject_workflow_version_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'workflow_versions_are_immutable';
END;
$$;
CREATE TRIGGER workflow_versions_immutable_before_update_or_delete
  BEFORE UPDATE OR DELETE ON workflow_versions FOR EACH ROW EXECUTE FUNCTION reject_workflow_version_mutation();

CREATE TABLE automation_tasks (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  store_id text NOT NULL,
  workflow_id text NOT NULL,
  workflow_version integer NOT NULL,
  order_id text NOT NULL,
  task_kind text NOT NULL CHECK (task_kind IN ('first_reminder', 'second_reminder')),
  status text NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'suppressed', 'handoff', 'submitted', 'sent', 'delivered', 'delivery_unknown', 'failed', 'stopped')),
  scheduled_at timestamptz NOT NULL,
  stop_reason text CHECK (stop_reason IN ('payment_received', 'cancelled', 'fulfilled', 'deleted', 'opted_out', 'handoff', 'workflow_paused', 'store_disabled', 'expired', 'manual')),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  provider_message_id text,
  result_evidence jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(result_evidence) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT automation_tasks_workflow_version_fk FOREIGN KEY (tenant_id, workflow_id, workflow_version)
    REFERENCES workflow_versions(tenant_id, workflow_id, version) ON DELETE RESTRICT,
  CONSTRAINT automation_tasks_workflow_store_fk FOREIGN KEY (tenant_id, workflow_id, store_id)
    REFERENCES workflows(tenant_id, id, store_id) ON DELETE RESTRICT,
  CONSTRAINT automation_tasks_order_fk FOREIGN KEY (tenant_id, store_id, order_id)
    REFERENCES orders(tenant_id, store_id, id) ON DELETE RESTRICT,
  CONSTRAINT automation_tasks_store_fk FOREIGN KEY (tenant_id, store_id)
    REFERENCES stores(tenant_id, id) ON DELETE RESTRICT,
  CONSTRAINT automation_tasks_dedupe_unique UNIQUE (tenant_id, workflow_id, order_id, task_kind),
  CONSTRAINT automation_tasks_tenant_id_unique UNIQUE (tenant_id, id)
);
CREATE INDEX automation_tasks_tenant_store_time_idx ON automation_tasks (tenant_id, store_id, scheduled_at DESC, id DESC);
CREATE INDEX automation_tasks_order_active_idx ON automation_tasks (tenant_id, order_id, status)
  WHERE status IN ('scheduled', 'suppressed', 'handoff');

CREATE TABLE automation_task_events (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  task_id text NOT NULL,
  event_type text NOT NULL,
  event_key text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  attempt_count integer NOT NULL CHECK (attempt_count >= 0),
  provider_message_id text,
  reason_code text,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(evidence) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT automation_task_events_dedupe_unique UNIQUE (tenant_id, task_id, event_key),
  CONSTRAINT automation_task_events_task_fk FOREIGN KEY (tenant_id, task_id)
    REFERENCES automation_tasks(tenant_id, id) ON DELETE RESTRICT
);
CREATE INDEX automation_task_events_timeline_idx ON automation_task_events (tenant_id, task_id, occurred_at DESC, id DESC);

CREATE TABLE knowledge_items (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  store_id text NOT NULL,
  type text NOT NULL CHECK (type IN ('faq', 'product')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  current_version integer NOT NULL CHECK (current_version > 0),
  published_version integer,
  created_by_user_id text NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  CONSTRAINT knowledge_items_store_fk FOREIGN KEY (tenant_id, store_id)
    REFERENCES stores(tenant_id, id) ON DELETE RESTRICT,
  CONSTRAINT knowledge_items_tenant_id_unique UNIQUE (tenant_id, id),
  CONSTRAINT knowledge_items_tenant_store_id_unique UNIQUE (tenant_id, store_id, id),
  CONSTRAINT knowledge_items_published_version_pair CHECK (status <> 'published' OR published_version IS NOT NULL)
);
CREATE INDEX knowledge_items_tenant_store_status_idx ON knowledge_items (tenant_id, store_id, status, updated_at DESC);

CREATE TABLE knowledge_item_versions (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  store_id text NOT NULL,
  item_id text NOT NULL,
  version integer NOT NULL CHECK (version > 0),
  locale text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  source_type text NOT NULL CHECK (source_type IN ('merchant_manual', 'woocommerce', 'approved_reference')),
  source_ref text NOT NULL,
  source_url text,
  source_updated_at timestamptz,
  created_by_user_id text NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT knowledge_item_versions_item_fk FOREIGN KEY (tenant_id, store_id, item_id)
    REFERENCES knowledge_items(tenant_id, store_id, id) ON DELETE RESTRICT,
  CONSTRAINT knowledge_item_versions_unique UNIQUE (tenant_id, store_id, item_id, version),
  CONSTRAINT knowledge_item_versions_tenant_item_version_unique UNIQUE (tenant_id, item_id, version),
  CONSTRAINT knowledge_item_versions_id_pair_unique UNIQUE (tenant_id, item_id, id)
);
ALTER TABLE knowledge_items ADD CONSTRAINT knowledge_items_current_version_fk
  FOREIGN KEY (tenant_id, id, current_version)
  REFERENCES knowledge_item_versions(tenant_id, item_id, version)
  DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE knowledge_items ADD CONSTRAINT knowledge_items_published_version_fk
  FOREIGN KEY (tenant_id, id, published_version)
  REFERENCES knowledge_item_versions(tenant_id, item_id, version)
  DEFERRABLE INITIALLY DEFERRED;
CREATE INDEX knowledge_item_versions_history_idx ON knowledge_item_versions (tenant_id, item_id, version DESC);

CREATE FUNCTION reject_knowledge_version_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'knowledge_item_versions_are_immutable';
END;
$$;
CREATE TRIGGER knowledge_item_versions_immutable_before_update_or_delete
  BEFORE UPDATE OR DELETE ON knowledge_item_versions FOR EACH ROW EXECUTE FUNCTION reject_knowledge_version_mutation();

CREATE TABLE knowledge_conflicts (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  store_id text NOT NULL,
  item_id text NOT NULL,
  item_version integer NOT NULL,
  other_item_id text NOT NULL,
  other_version integer NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'ignored')),
  decision text CHECK (decision IN ('adopt_item', 'adopt_other', 'manual_merge', 'ignore')),
  reason text,
  resolved_by_user_id text REFERENCES users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT knowledge_conflicts_store_fk FOREIGN KEY (tenant_id, store_id)
    REFERENCES stores(tenant_id, id) ON DELETE RESTRICT,
  CONSTRAINT knowledge_conflicts_item_fk FOREIGN KEY (tenant_id, store_id, item_id, item_version)
    REFERENCES knowledge_item_versions(tenant_id, store_id, item_id, version) ON DELETE RESTRICT,
  CONSTRAINT knowledge_conflicts_other_fk FOREIGN KEY (tenant_id, store_id, other_item_id, other_version)
    REFERENCES knowledge_item_versions(tenant_id, store_id, item_id, version) ON DELETE RESTRICT,
  CONSTRAINT knowledge_conflicts_distinct_items CHECK (item_id <> other_item_id),
  CONSTRAINT knowledge_conflicts_pair_unique UNIQUE (tenant_id, item_id, item_version, other_item_id, other_version)
);
CREATE INDEX knowledge_conflicts_open_idx ON knowledge_conflicts (tenant_id, store_id, created_at DESC)
  WHERE status = 'open';
