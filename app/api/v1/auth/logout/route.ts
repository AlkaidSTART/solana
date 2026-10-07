import { clearCsrfCookie, clearSessionCookie, requireWriteUser } from "@/lib/server/auth/session";
import { withApiHandler } from "@/lib/server/http/handler";
import { ok } from "@/lib/server/http/responses";
import { appendSetCookies, revokeSession } from "@/lib/server/services/auth/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (request, context) => {
  const session = await requireWriteUser(request);
  await revokeSession(session);
  return appendSetCookies(ok(context, { loggedOut: true }), [clearSessionCookie(), clearCsrfCookie()]);
});
