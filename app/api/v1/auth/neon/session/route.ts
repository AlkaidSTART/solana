import { z } from "zod";

import { neonAuth } from "@/lib/auth/server";
import { ApiError } from "@/lib/server/http/errors";
import { withApiHandler } from "@/lib/server/http/handler";
import { parseJson } from "@/lib/server/http/request";
import { ok } from "@/lib/server/http/responses";
import { issueSessionForNeonIdentity } from "@/lib/server/services/auth/neon-bridge";
import { appendSetCookies } from "@/lib/server/services/auth/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  locale: z.string().trim().min(2).max(16).regex(/^[A-Za-z0-9_-]+$/),
}).strict();

export const POST = withApiHandler(async (request, context) => {
  const { locale } = await parseJson(request, bodySchema, 4 * 1024);
  const { data } = await neonAuth().getSession();
  const email = data?.user?.email;
  if (!email) {
    throw new ApiError(401, "UNAUTHENTICATED", "A Neon Auth session is required");
  }
  const result = await issueSessionForNeonIdentity({ email, locale });
  return appendSetCookies(ok(context, { user: result.user, memberships: result.memberships }), result.setCookie);
});
