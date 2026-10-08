import { z } from "zod";

import { requireWriteUser } from "@/lib/server/auth/session";
import { withApiHandler } from "@/lib/server/http/handler";
import { parseJson } from "@/lib/server/http/request";
import { ok } from "@/lib/server/http/responses";
import { appendSetCookies, switchTenantSession } from "@/lib/server/services/auth/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const switchTenantSchema = z.object({ membershipId: z.string().min(1).max(128) }).strict();

export const POST = withApiHandler(async (request, context) => {
  const session = await requireWriteUser(request);
  const body = await parseJson(request, switchTenantSchema, 8 * 1024);
  const result = await switchTenantSession(session, body.membershipId);
  return appendSetCookies(ok(context, { membership: result.membership }), result.setCookie);
});
