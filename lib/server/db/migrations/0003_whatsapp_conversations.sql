CREATE TABLE channels (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  store_id text NOT NULL,
  provider text NOT NULL CHECK (provider = 'whatsapp_cloud_api'),
  phone_number_id text NOT NULL UNIQUE,
  business_account_id text NOT NULL,
  display_phone_ciphertext text NOT NULL,
  display_phone_hash text NOT NULL,
  display_phone_last4 text NOT NULL CHECK (display_phone_last4 ~ '^[0-9]{4}$'),
  status text NOT NULL DEFAULT 'unverified'
    CHECK (status IN ('unverified', 'active', 'disabled', 'deleting', 'deleted')),
  verification_evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_webhook_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT channels_tenant_id_unique UNIQUE (tenant_id, id),
  CONSTRAINT channels_store_tenant_fk FOREIGN KEY (tenant_id, store_id)
    REFERENCES stores (tenant_id, id) ON DELETE RESTRICT,
  CONSTRAINT channels_phone_scope_unique UNIQUE (tenant_id, store_id, display_phone_hash)
);
CREATE INDEX channels_tenant_status_idx ON channels (tenant_id, status, updated_at DESC);
CREATE INDEX channels_store_idx ON channels (tenant_id, store_id, status);

CREATE TABLE whatsapp_channel_credentials (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  channel_id text NOT NULL,
  version integer NOT NULL CHECK (version > 0),
  access_token_ciphertext text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked')),
  created_by_user_id text REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  activated_at timestamptz,
  revoked_at timestamptz,
  CONSTRAINT whatsapp_channel_credentials_version_unique UNIQUE (tenant_id, channel_id, version),
  CONSTRAINT whatsapp_channel_credentials_tenant_id_unique UNIQUE (tenant_id, channel_id, id),
  CONSTRAINT whatsapp_channel_credentials_channel_fk FOREIGN KEY (tenant_id, channel_id)
    REFERENCES channels (tenant_id, id) ON DELETE RESTRICT
);
CREATE UNIQUE INDEX whatsapp_channel_credentials_active_unique ON whatsapp_channel_credentials (tenant_id, channel_id)
  WHERE status = 'active';
CREATE INDEX whatsapp_channel_credentials_pending_idx ON whatsapp_channel_credentials (tenant_id, channel_id, created_at DESC)
  WHERE status = 'pending';

CREATE TABLE whatsapp_templates (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  channel_id text NOT NULL,
  provider_template_id text,
  name text NOT NULL,
  locale text NOT NULL,
  category text NOT NULL CHECK (category IN ('marketing', 'utility', 'authentication', 'unknown')),
  status text NOT NULL DEFAULT 'unknown'
    CHECK (status IN ('unknown', 'pending', 'approved', 'rejected', 'paused')),
  approval_evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  components_digest text,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT whatsapp_templates_channel_fk FOREIGN KEY (tenant_id, channel_id)
    REFERENCES channels (tenant_id, id) ON DELETE RESTRICT,
  CONSTRAINT whatsapp_templates_tenant_id_unique UNIQUE (tenant_id, id),
  CONSTRAINT whatsapp_templates_name_locale_unique UNIQUE (tenant_id, channel_id, name, locale)
);
CREATE UNIQUE INDEX whatsapp_templates_provider_id_unique ON whatsapp_templates (channel_id, provider_template_id)
  WHERE provider_template_id IS NOT NULL;
CREATE INDEX whatsapp_templates_readiness_idx ON whatsapp_templates (tenant_id, channel_id, status, locale);

CREATE TABLE whatsapp_webhook_events (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  channel_id text NOT NULL,
  provider_event_id text NOT NULL,
  event_type text NOT NULL,
  payload_digest text NOT NULL,
  payload_ciphertext text NOT NULL,
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processed', 'conflict', 'failed')),
  occurred_at timestamptz,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  error_code text,
  CONSTRAINT whatsapp_webhook_events_provider_id_unique UNIQUE (channel_id, provider_event_id),
  CONSTRAINT whatsapp_webhook_events_channel_fk FOREIGN KEY (tenant_id, channel_id)
    REFERENCES channels (tenant_id, id) ON DELETE RESTRICT
);
CREATE INDEX whatsapp_webhook_events_pending_idx ON whatsapp_webhook_events (received_at)
  WHERE status IN ('received', 'failed');
CREATE INDEX whatsapp_webhook_events_tenant_time_idx ON whatsapp_webhook_events (tenant_id, received_at DESC);

CREATE TABLE contacts (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  store_id text NOT NULL,
  phone_hash text NOT NULL,
  phone_ciphertext text NOT NULL,
  phone_last4 text NOT NULL CHECK (phone_last4 ~ '^[0-9]{4}$'),
  locale text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contacts_store_tenant_fk FOREIGN KEY (tenant_id, store_id)
    REFERENCES stores (tenant_id, id) ON DELETE RESTRICT,
  CONSTRAINT contacts_store_phone_unique UNIQUE (tenant_id, store_id, phone_hash),
  CONSTRAINT contacts_tenant_store_id_unique UNIQUE (tenant_id, store_id, id)
);
CREATE INDEX contacts_tenant_store_time_idx ON contacts (tenant_id, store_id, created_at DESC);

CREATE TABLE consents (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  store_id text NOT NULL,
  contact_id text NOT NULL,
  purpose text NOT NULL CHECK (purpose IN ('customer_service', 'utility', 'marketing', 'all')),
  terms_version text NOT NULL,
  source text NOT NULL,
  granted_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT consents_contact_fk FOREIGN KEY (tenant_id, store_id, contact_id)
    REFERENCES contacts (tenant_id, store_id, id) ON DELETE RESTRICT
);
CREATE INDEX consents_current_idx ON consents (tenant_id, store_id, contact_id, purpose, granted_at DESC)
  WHERE revoked_at IS NULL;

CREATE TABLE suppression_entries (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  store_id text NOT NULL,
  contact_id text NOT NULL,
  reason text NOT NULL CHECK (reason IN ('opt_out', 'manual', 'legal')),
  source text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  CONSTRAINT suppression_entries_contact_fk FOREIGN KEY (tenant_id, store_id, contact_id)
    REFERENCES contacts (tenant_id, store_id, id) ON DELETE RESTRICT
);
CREATE UNIQUE INDEX suppression_entries_active_unique ON suppression_entries (tenant_id, store_id, contact_id)
  WHERE revoked_at IS NULL;
CREATE INDEX suppression_entries_history_idx ON suppression_entries (tenant_id, store_id, contact_id, created_at DESC);

CREATE TABLE conversations (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  store_id text NOT NULL,
  channel_id text NOT NULL,
  contact_id text NOT NULL,
  status text NOT NULL DEFAULT 'automated'
    CHECK (status IN ('automated', 'waiting_human', 'human_active', 'resolved')),
  assigned_to_membership_id text,
  language text,
  last_inbound_at timestamptz,
  service_window_expires_at timestamptz,
  last_message_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  CONSTRAINT conversations_channel_fk FOREIGN KEY (tenant_id, channel_id)
    REFERENCES channels (tenant_id, id) ON DELETE RESTRICT,
  CONSTRAINT conversations_store_fk FOREIGN KEY (tenant_id, store_id)
    REFERENCES stores (tenant_id, id) ON DELETE RESTRICT,
  CONSTRAINT conversations_contact_fk FOREIGN KEY (tenant_id, store_id, contact_id)
    REFERENCES contacts (tenant_id, store_id, id) ON DELETE RESTRICT,
  CONSTRAINT conversations_assignee_fk FOREIGN KEY (tenant_id, assigned_to_membership_id)
    REFERENCES memberships (tenant_id, id) ON DELETE RESTRICT,
  CONSTRAINT conversations_assignment_state_check CHECK (
    (status = 'human_active' AND assigned_to_membership_id IS NOT NULL)
    OR (status <> 'human_active')
  ),
  CONSTRAINT conversations_tenant_store_id_unique UNIQUE (tenant_id, store_id, id)
);
CREATE UNIQUE INDEX conversations_one_open_contact_unique ON conversations (tenant_id, channel_id, contact_id)
  WHERE status <> 'resolved';
CREATE INDEX conversations_queue_idx ON conversations (tenant_id, store_id, status, last_message_at DESC);
CREATE INDEX conversations_assignee_idx ON conversations (tenant_id, assigned_to_membership_id, status, updated_at DESC);

CREATE TABLE conversation_events (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  store_id text NOT NULL,
  conversation_id text NOT NULL,
  actor_user_id text REFERENCES users(id) ON DELETE SET NULL,
  actor_membership_id text,
  event_type text NOT NULL,
  detail_ciphertext text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT conversation_events_conversation_fk FOREIGN KEY (tenant_id, store_id, conversation_id)
    REFERENCES conversations (tenant_id, store_id, id) ON DELETE RESTRICT,
  CONSTRAINT conversation_events_actor_fk FOREIGN KEY (tenant_id, actor_membership_id)
    REFERENCES memberships (tenant_id, id) ON DELETE RESTRICT
);
CREATE INDEX conversation_events_timeline_idx ON conversation_events (tenant_id, conversation_id, created_at DESC);

CREATE TABLE conversation_messages (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  store_id text NOT NULL,
  conversation_id text NOT NULL,
  provider_message_id text,
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_type text NOT NULL CHECK (message_type IN ('text', 'template', 'image', 'audio', 'video', 'document', 'interactive', 'unsupported')),
  status text NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'queued', 'unknown', 'accepted', 'sent', 'delivered', 'read', 'failed')),
  content_ciphertext text,
  translation_ciphertext text,
  language text,
  template_id text,
  status_evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by_user_id text REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  CONSTRAINT conversation_messages_conversation_fk FOREIGN KEY (tenant_id, store_id, conversation_id)
    REFERENCES conversations (tenant_id, store_id, id) ON DELETE RESTRICT,
  CONSTRAINT conversation_messages_template_fk FOREIGN KEY (tenant_id, template_id)
    REFERENCES whatsapp_templates (tenant_id, id) ON DELETE RESTRICT,
  CONSTRAINT conversation_messages_tenant_id_unique UNIQUE (tenant_id, id)
);
CREATE UNIQUE INDEX conversation_messages_provider_id_unique ON conversation_messages (tenant_id, provider_message_id)
  WHERE provider_message_id IS NOT NULL;
CREATE INDEX conversation_messages_timeline_idx ON conversation_messages (tenant_id, conversation_id, created_at DESC, id DESC);
CREATE INDEX conversation_messages_status_idx ON conversation_messages (tenant_id, status, created_at)
  WHERE status IN ('queued', 'unknown', 'accepted');
