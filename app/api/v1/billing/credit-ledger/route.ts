import { z } from "zod";

import { requireActor } from "@/lib/server/auth/session";
import { ApiError } from "@/lib/server/http/errors";
import { withApiHandler } from "@/lib/server/http/handler";
import { list } from "@/lib/server/http/responses";
import { listCreditLedger } from "@/lib/server/services/billing/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const creditLedgerQuerySchema = z.object({
  type: z.string().trim().max(32).nullable(),
  from: z.string().trim().max(64).nullable(),
  to: z.string().trim().max(64).nullable(),
  cursor: z.string().trim().max(512).nullable(),
}).strict();

export const GET = withApiHandler(async (request, context) => {
  const actor = await requireActor(request, ["Owner", "Finance"]);
  const query = new URL(request.url).searchParams;
  const parsed = creditLedgerQuerySchema.safeParse({
    type: query.get("type"),
    from: query.get("from"),
    to: query.get("to"),
    cursor: query.get("cursor"),
  });
  if (!parsed.success) {
    throw new ApiError(400, "INVALID_QUERY", "Credit ledger query is invalid");
  }
  const page = await listCreditLedger(actor, parsed.data);
  return list(context, page.items, page.pageInfo);
});
