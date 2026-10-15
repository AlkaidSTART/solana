import { randomUUID } from "node:crypto";

import { getRuntimeConfig } from "@/lib/server/config/env";
import type { TransactionSql } from "@/lib/server/db/client";
import { ApiError } from "@/lib/server/http/errors";
import { canonicalJsonDigest } from "@/lib/server/security/digests";

import { classifyGraphFailure, graphTemplatesUrl, type GraphFailure } from "./graph";

const GRAPH_REQUEST_TIMEOUT_MS = 15_000;
const MAX_GRAPH_RESPONSE_BYTES = 1024 * 1024;
const MAX_TEMPLATES_PER_SYNC = 500;

export type TemplateCategory = "marketing" | "utility" | "authentication" | "unknown";
export type TemplateStatus = "unknown" | "pending" | "approved" | "rejected" | "paused";

export interface GraphTemplateSummary {
  providerTemplateId: string | null;
  name: string;
  locale: string;
  category: TemplateCategory;
  status: TemplateStatus;
  componentsDigest: string;
}

export type TemplateFetchResult =
  | { ok: true; templates: GraphTemplateSummary[] }
  | { ok: false; failure: GraphFailure };

export function mapTemplateCategory(value: unknown): TemplateCategory {
  const normalized = typeof value === "string" ? value.trim().toUpperCase() : "";

  if (normalized === "MARKETING") return "marketing";
  if (normalized === "UTILITY") return "utility";
  if (normalized === "AUTHENTICATION") return "authentication";
  return "unknown";
}

export function mapTemplateStatus(value: unknown): TemplateStatus {
  const normalized = typeof value === "string" ? value.trim().toUpperCase() : "";

  if (normalized === "APPROVED") return "approved";
  if (normalized === "PAUSED") return "paused";
  if (normalized === "REJECTED" || normalized === "DISABLED" || normalized === "DELETED") return "rejected";
  if (normalized === "PENDING" || normalized === "IN_APPEAL" || normalized === "PENDING_DELETION") return "pending";
  return "unknown";
}

export function normalizeGraphTemplate(raw: unknown): GraphTemplateSummary | null {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }

  const name = (raw as { name?: unknown }).name;
  const locale = (raw as { language?: unknown }).language;
  if (typeof name !== "string" || name.length === 0 || name.length > 512) {
    return null;
  }
  if (typeof locale !== "string" || !/^[a-z]{2}(?:_[A-Z]{2})?$/.test(locale)) {
    return null;
  }

  const rawId = (raw as { id?: unknown }).id;
  const providerTemplateId = typeof rawId === "string" && /^[A-Za-z0-9_.:-]{1,128}$/.test(rawId) ? rawId : null;
  const components = (raw as { components?: unknown }).components;

  return {
    providerTemplateId,
    name,
    locale,
    category: mapTemplateCategory((raw as { category?: unknown }).category),
    status: mapTemplateStatus((raw as { status?: unknown }).status),
    componentsDigest: canonicalJsonDigest(Array.isArray(components) ? components : []),
  };
}

export async function fetchGraphTemplates(input: {
  businessAccountId: string;
  accessToken: string;
  after?: string;
}): Promise<TemplateFetchResult> {
  const version = getRuntimeConfig().whatsapp.graphApiVersion;
  if (!version) {
    throw new ApiError(503, "CAPABILITY_UNAVAILABLE", "WhatsApp Graph API version is not configured", { retryable: true });
  }

  const url = new URL(graphTemplatesUrl(version, input.businessAccountId));
  url.searchParams.set("fields", "id,name,language,category,status,components");
  url.searchParams.set("limit", "100");
  if (input.after) {
    url.searchParams.set("after", input.after);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${input.accessToken}` },
      signal: AbortSignal.timeout(GRAPH_REQUEST_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch {
    return { ok: false, failure: { classification: "unknown", code: null, details: "WhatsApp template request failed" } };
  }

  const body = await readBoundedJson(response);
  if (!response.ok) {
    return { ok: false, failure: classifyGraphFailure(response.status, body) };
  }

  const data = typeof body === "object" && body !== null ? (body as { data?: unknown }).data : undefined;
  if (!Array.isArray(data)) {
    return { ok: false, failure: { classification: "unknown", code: null, details: "WhatsApp template response was malformed" } };
  }

  const templates: GraphTemplateSummary[] = [];
  for (const entry of data.slice(0, MAX_TEMPLATES_PER_SYNC)) {
    const template = normalizeGraphTemplate(entry);
    if (template) {
      templates.push(template);
    }
  }

  return { ok: true, templates };
}

/**
 * Mirrors provider-approved templates into our tables. Provider status is authoritative: a template
 * that is not approved upstream must not stay sendable locally.
 */
export async function applyTemplateSync(
  transaction: TransactionSql,
  input: { tenantId: string; channelId: string; templates: GraphTemplateSummary[] },
): Promise<number> {
  for (const template of input.templates) {
    await transaction`
      INSERT INTO whatsapp_templates (
        id, tenant_id, channel_id, provider_template_id, name, locale, category, status,
        approval_evidence, components_digest, last_synced_at, created_at, updated_at
      ) VALUES (
        ${randomUUID()}, ${input.tenantId}, ${input.channelId}, ${template.providerTemplateId},
        ${template.name}, ${template.locale}, ${template.category}, ${template.status},
        ${JSON.stringify({ source: "graph_api", syncedAt: new Date().toISOString() })}::jsonb,
        ${template.componentsDigest}, now(), now(), now()
      )
      ON CONFLICT (tenant_id, channel_id, name, locale) DO UPDATE SET
        provider_template_id = coalesce(excluded.provider_template_id, whatsapp_templates.provider_template_id),
        category = excluded.category,
        status = excluded.status,
        approval_evidence = excluded.approval_evidence,
        components_digest = excluded.components_digest,
        last_synced_at = now(),
        updated_at = now()
    `;
  }

  return input.templates.length;
}

async function readBoundedJson(response: Response): Promise<unknown> {
  try {
    const text = await response.text();
    if (text.length === 0 || text.length > MAX_GRAPH_RESPONSE_BYTES) {
      return null;
    }
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}
