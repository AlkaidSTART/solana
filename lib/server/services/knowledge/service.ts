import { randomUUID } from "node:crypto";
import { z } from "zod";

import type { ActorContext } from "@/lib/server/auth/types";
import { writeAuditEvent } from "@/lib/server/audit/service";
import { withDatabase, withTransaction } from "@/lib/server/db/client";
import { ApiError } from "@/lib/server/http/errors";
import type { RequestContext } from "@/lib/server/http/request";
import { executeIdempotent } from "@/lib/server/idempotency/service";
import { sha256Hex } from "@/lib/server/security/digests";

export const knowledgeContentSchema = z.object({
  type: z.enum(["faq", "product"]), locale: z.string().trim().min(2).max(16),
  title: z.string().trim().min(1).max(200), body: z.string().trim().min(1).max(12000),
  sourceType: z.enum(["merchant_manual", "woocommerce", "approved_reference"]),
  sourceRef: z.string().trim().min(1).max(256), sourceUrl: z.string().url().max(2048).optional(),
  sourceUpdatedAt: z.string().datetime({ offset: true }).optional(),
}).strict();
export const patchKnowledgeSchema = knowledgeContentSchema.partial().strict().refine((x) => Object.keys(x).length > 0);
export const resolveConflictSchema = z.object({ decision: z.enum(["adopt_item", "adopt_other", "manual_merge", "ignore"]), reasonCode: z.string().regex(/^[a-z][a-z0-9_:-]{1,63}$/) }).strict();
export const archiveKnowledgeSchema = z.object({ reason: z.string().trim().min(1).max(500) }).strict();

interface KnowledgeListRow {
  id: string;
  updatedAt: Date;
  [key: string]: unknown;
}

export async function listKnowledge(actor: ActorContext, options: {
  storeId?: string | null;
  status?: string | null;
  type?: string | null;
  locale?: string | null;
  search?: string | null;
  cursor?: string | null;
}) {
  if (actor.role === "Agent" && options.storeId && !actor.storeIds.includes(options.storeId)) throw notFound();
  if (options.status && !["draft", "published", "archived"].includes(options.status)) {
    throw new ApiError(400, "INVALID_KNOWLEDGE_STATUS", "Knowledge status filter is invalid");
  }
  if (options.type && options.type !== "faq" && options.type !== "product") {
    throw new ApiError(400, "INVALID_KNOWLEDGE_TYPE", "Knowledge type filter is invalid");
  }
  if (options.locale && (options.locale.length > 16 || !/^[A-Za-z0-9_-]{2,16}$/.test(options.locale))) {
    throw new ApiError(400, "INVALID_LOCALE", "Knowledge locale filter is invalid");
  }
  if (options.search && (options.search.length > 100 || /[\u0000-\u001f\u007f]/.test(options.search))) {
    throw new ApiError(400, "INVALID_SEARCH", "Knowledge search text is invalid");
  }
  const cursor = decodeKnowledgeCursor(options.cursor ?? null);
  return withDatabase(async (sql) => {
    const rows = await sql<KnowledgeListRow[]>`
    SELECT k.id, k.store_id AS "storeId", k.type, k.status, k.current_version AS "currentVersion",
      k.published_version AS "publishedVersion", k.updated_at AS "updatedAt", v.locale, v.title, v.source_type AS "sourceType"
    FROM knowledge_items k JOIN knowledge_item_versions v ON v.tenant_id=k.tenant_id AND v.item_id=k.id AND v.version=k.current_version
    WHERE k.tenant_id=${actor.tenantId} AND (${options.storeId ?? null}::text IS NULL OR k.store_id=${options.storeId ?? null})
      AND (${options.status ?? null}::text IS NULL OR k.status=${options.status ?? null})
      AND (${options.type ?? null}::text IS NULL OR k.type=${options.type ?? null})
      AND (${options.locale ?? null}::text IS NULL OR v.locale=${options.locale ?? null})
      AND (${options.search ?? null}::text IS NULL
        OR v.title ILIKE ('%' || ${options.search ?? null} || '%')
        OR v.body ILIKE ('%' || ${options.search ?? null} || '%'))
      AND (${actor.role === "Agent"}=false OR k.store_id=ANY(${actor.storeIds}))
      AND (${cursor?.updatedAt ?? null}::timestamptz IS NULL
        OR (k.updated_at, k.id) < (${cursor?.updatedAt ?? null}::timestamptz, ${cursor?.id ?? null}::text))
    ORDER BY k.updated_at DESC, k.id DESC LIMIT 101
  `;
    const hasNextPage = rows.length > 100;
    const items = hasNextPage ? rows.slice(0, 100) : rows;
    const last = items.at(-1);
    return {
      items,
      pageInfo: {
        hasNextPage,
        nextCursor: hasNextPage && last
          ? encodeKnowledgeCursor({ updatedAt: last.updatedAt.toISOString(), id: last.id })
          : null,
      },
    };
  });
}

export async function getKnowledge(actor: ActorContext, itemId: string) {
  return withDatabase(async (sql) => {
    const rows = await sql`
      SELECT k.id,k.store_id AS "storeId",k.type,k.status,k.current_version AS "currentVersion",k.published_version AS "publishedVersion",
        v.locale,v.title,v.body,v.source_type AS "sourceType",v.source_ref AS "sourceRef",v.source_url AS "sourceUrl",
        v.source_updated_at AS "sourceUpdatedAt",v.created_at AS "versionCreatedAt"
      FROM knowledge_items k JOIN knowledge_item_versions v ON v.tenant_id=k.tenant_id AND v.item_id=k.id AND v.version=k.current_version
      WHERE k.tenant_id=${actor.tenantId} AND k.id=${itemId} AND (${actor.role === "Agent"}=false OR k.store_id=ANY(${actor.storeIds}))
    `;
    if (!rows[0]) throw notFound();
    return rows[0];
  });
}

export async function createKnowledge(actor: ActorContext, storeId: string, input: z.output<typeof knowledgeContentSchema>, key: string, context: RequestContext) {
  return executeIdempotent(actor, "knowledge.create", key, { storeId, input }, async (tx) => {
    const stores = await tx<{ id: string }[]>`SELECT id FROM stores WHERE tenant_id=${actor.tenantId} AND id=${storeId}`;
    if (!stores[0]) throw notFound();
    const id = randomUUID();
    await tx`INSERT INTO knowledge_items (id,tenant_id,store_id,type,current_version,created_by_user_id)
      VALUES (${id},${actor.tenantId},${storeId},${input.type},1,${actor.userId})`;
    await insertVersion(tx, actor, storeId, id, 1, input);
    await detectConflicts(tx, actor, storeId, id, 1, input);
    await writeAuditEvent({ actor, action: "knowledge.created", resourceType: "knowledge_item", resourceId: id,
      requestId: context.requestId, metadata: { type: input.type, version: 1, sourceType: input.sourceType } }, tx);
    return { status: 201, body: { id, storeId, type: input.type, status: "draft", currentVersion: 1, locale: input.locale } };
  });
}

export async function patchKnowledge(actor: ActorContext, itemId: string, expectedVersion: number, patch: z.output<typeof patchKnowledgeSchema>, context: RequestContext) {
  return withTransaction(async (tx) => {
    const rows = await tx<{ id:string;store_id:string;type:"faq"|"product";status:string;current_version:number;locale:string;title:string;body:string;source_type:"merchant_manual"|"woocommerce"|"approved_reference";source_ref:string;source_url:string|null;source_updated_at:Date|null }[]>`
      SELECT k.id,k.store_id,k.type,k.status,k.current_version,v.locale,v.title,v.body,v.source_type,v.source_ref,v.source_url,v.source_updated_at
      FROM knowledge_items k JOIN knowledge_item_versions v ON v.tenant_id=k.tenant_id AND v.item_id=k.id AND v.version=k.current_version
      WHERE k.tenant_id=${actor.tenantId} AND k.id=${itemId} AND (${actor.role === "Agent"}=false OR k.store_id=ANY(${actor.storeIds})) FOR UPDATE OF k`;
    const current = rows[0];
    if (!current) throw notFound();
    if (current.current_version !== expectedVersion) throw new ApiError(409,"VERSION_CONFLICT","Knowledge item was changed by another request");
    const next = knowledgeContentSchema.parse({
      type: patch.type ?? current.type,
      locale: patch.locale ?? current.locale,
      title: patch.title ?? current.title,
      body: patch.body ?? current.body,
      sourceType: patch.sourceType ?? current.source_type,
      sourceRef: patch.sourceRef ?? current.source_ref,
      sourceUrl: patch.sourceUrl ?? current.source_url ?? undefined,
      sourceUpdatedAt: patch.sourceUpdatedAt ?? current.source_updated_at?.toISOString() ?? undefined,
    });
    const version = expectedVersion + 1;
    await insertVersion(tx, actor, current.store_id, itemId, version, next);
    await detectConflicts(tx, actor, current.store_id, itemId, version, next);
    await tx`UPDATE knowledge_items SET type=${next.type},current_version=${version},status=CASE WHEN status='published' THEN 'draft' ELSE status END,
      published_version=NULL,updated_at=now() WHERE tenant_id=${actor.tenantId} AND id=${itemId}`;
    await writeAuditEvent({ actor, action: "knowledge.version_created", resourceType: "knowledge_item", resourceId: itemId,
      requestId: context.requestId, metadata: { version } }, tx);
    return { id:itemId, currentVersion:version, status:"draft", locale:next.locale };
  });
}

export async function archiveKnowledge(actor: ActorContext, itemId: string, reason: string, key: string, context: RequestContext) {
  const reasonDigest = sha256Hex(reason);
  const result = await executeIdempotent(actor, "knowledge.archive", key, { itemId, reasonDigest }, async (tx) => {
    const rows = await tx<{ id:string;store_id:string }[]>`UPDATE knowledge_items SET status='archived',archived_at=now(),updated_at=now()
      WHERE tenant_id=${actor.tenantId} AND id=${itemId} AND (${actor.role === "Agent"}=false OR store_id=ANY(${actor.storeIds}))
      RETURNING id,store_id`;
    if (!rows[0]) throw notFound();
    await writeAuditEvent({ actor, action:"knowledge.archived", resourceType:"knowledge_item", resourceId:itemId, requestId:context.requestId,
      metadata:{reasonDigest}},tx);
    return { status:200, body:{ id:itemId,status:"archived" } };
  });
  return result.body;
}

export async function publishKnowledge(actor: ActorContext,itemId:string,expectedVersion:number,context:RequestContext) {
  return withTransaction(async(tx)=>{
    const rows=await tx<{id:string;current_version:number;store_id:string}[]>`SELECT id,current_version,store_id FROM knowledge_items
      WHERE tenant_id=${actor.tenantId} AND id=${itemId} AND (${actor.role === "Agent"}=false OR store_id=ANY(${actor.storeIds})) FOR UPDATE`;
    const item=rows[0]; if(!item) throw notFound();
    if(item.current_version!==expectedVersion) throw new ApiError(409,"VERSION_CONFLICT","Knowledge item was changed by another request");
    const open=await tx<{id:string}[]>`SELECT id FROM knowledge_conflicts WHERE tenant_id=${actor.tenantId} AND store_id=${item.store_id}
      AND status='open' AND (item_id=${itemId} OR other_item_id=${itemId}) LIMIT 1`;
    if(open[0]) throw new ApiError(422,"KNOWLEDGE_CONFLICT_UNRESOLVED","Resolve knowledge conflicts before publishing");
    await tx`UPDATE knowledge_items SET status='published',published_version=${expectedVersion},updated_at=now() WHERE tenant_id=${actor.tenantId} AND id=${itemId}`;
    await writeAuditEvent({actor,action:"knowledge.published",resourceType:"knowledge_item",resourceId:itemId,requestId:context.requestId,metadata:{version:expectedVersion}},tx);
    return {id:itemId,status:"published",publishedVersion:expectedVersion};
  });
}

export async function listConflicts(actor:ActorContext,storeId?:string|null,status?:string|null) {
  return withDatabase(async(sql)=>({items:await sql`SELECT id,store_id AS "storeId",item_id AS "itemId",item_version AS "itemVersion",
    other_item_id AS "otherItemId",other_version AS "otherVersion",status,decision,created_at AS "createdAt",resolved_at AS "resolvedAt"
    FROM knowledge_conflicts WHERE tenant_id=${actor.tenantId} AND (${storeId??null}::text IS NULL OR store_id=${storeId??null})
    AND (${status??null}::text IS NULL OR status=${status??null}) AND (${actor.role === "Agent"}=false OR store_id=ANY(${actor.storeIds}))
    ORDER BY created_at DESC,id DESC LIMIT 100` }));
}

export async function resolveConflict(actor:ActorContext,id:string,input:z.output<typeof resolveConflictSchema>,context:RequestContext) {
  return withTransaction(async(tx)=>{
    const rows=await tx<{id:string;store_id:string}[]>`UPDATE knowledge_conflicts SET status=${input.decision === "ignore" ? "ignored" : "resolved"},
      decision=${input.decision},reason=${input.reasonCode},resolved_by_user_id=${actor.userId},resolved_at=now()
      WHERE tenant_id=${actor.tenantId} AND id=${id} AND (${actor.role === "Agent"}=false OR store_id=ANY(${actor.storeIds})) AND status='open'
      RETURNING id,store_id`;
    if(!rows[0]) throw notFound();
    await writeAuditEvent({actor,action:"knowledge.conflict_resolved",resourceType:"knowledge_conflict",resourceId:id,requestId:context.requestId,
      metadata:{decision:input.decision,reasonCode:input.reasonCode}},tx);
    return {id,status:input.decision === "ignore" ? "ignored" : "resolved",decision:input.decision};
  });
}

export function knowledgeCapabilityUnavailable(capability:"translation"|"sync"):never {
  throw new ApiError(503,"CAPABILITY_UNAVAILABLE",`${capability === "sync" ? "Knowledge synchronization" : "Translation suggestions"} are unavailable without a configured provider and worker`);
}

async function insertVersion(tx: import("@/lib/server/db/client").TransactionSql,actor:ActorContext,storeId:string,itemId:string,version:number,input:z.output<typeof knowledgeContentSchema>) {
  await tx`INSERT INTO knowledge_item_versions (id,tenant_id,store_id,item_id,version,locale,title,body,source_type,source_ref,source_url,source_updated_at,created_by_user_id)
    VALUES (${randomUUID()},${actor.tenantId},${storeId},${itemId},${version},${input.locale},${input.title},${input.body},${input.sourceType},${input.sourceRef},${input.sourceUrl??null},${input.sourceUpdatedAt??null},${actor.userId})`;
}
async function detectConflicts(tx:import("@/lib/server/db/client").TransactionSql,actor:ActorContext,storeId:string,itemId:string,version:number,input:z.output<typeof knowledgeContentSchema>) {
  const rows=await tx<{id:string;current_version:number}[]>`SELECT k.id,k.current_version FROM knowledge_items k JOIN knowledge_item_versions v
    ON v.tenant_id=k.tenant_id AND v.item_id=k.id AND v.version=k.current_version WHERE k.tenant_id=${actor.tenantId} AND k.store_id=${storeId}
    AND k.id<>${itemId} AND k.status<>'archived' AND v.locale=${input.locale} AND lower(v.title)=lower(${input.title}) LIMIT 10`;
  for(const row of rows) await tx`INSERT INTO knowledge_conflicts (id,tenant_id,store_id,item_id,item_version,other_item_id,other_version)
    VALUES (${randomUUID()},${actor.tenantId},${storeId},${itemId},${version},${row.id},${row.current_version}) ON CONFLICT DO NOTHING`;
}
function encodeKnowledgeCursor(cursor:{updatedAt:string;id:string}):string {
  return Buffer.from(JSON.stringify(cursor),"utf8").toString("base64url");
}
function decodeKnowledgeCursor(value:string|null):{updatedAt:string;id:string}|null {
  if(value===null)return null;
  if(!/^[A-Za-z0-9_-]{1,512}$/.test(value))throw invalidKnowledgeCursor();
  try{
    const decoded=Buffer.from(value,"base64url").toString("utf8");
    if(Buffer.from(decoded,"utf8").toString("base64url")!==value)throw new TypeError("Non-canonical cursor");
    const parsed=z.object({
      updatedAt:z.string().datetime({offset:true}),
      id:z.string().min(1).max(128),
    }).strict().parse(JSON.parse(decoded) as unknown);
    return parsed;
  }catch{
    throw invalidKnowledgeCursor();
  }
}
function invalidKnowledgeCursor():ApiError{return new ApiError(400,"INVALID_CURSOR","Knowledge cursor is invalid");}
function notFound():ApiError{return new ApiError(404,"NOT_FOUND","Knowledge resource was not found");}
