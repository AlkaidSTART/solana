import { z } from "zod";

import { verifyOtpAndIssueSession } from "@/lib/server/auth/otp";
import { getRuntimeConfig } from "@/lib/server/config/env";
import { ApiError } from "@/lib/server/http/errors";
import { withApiHandler } from "@/lib/server/http/handler";
import { parseJson } from "@/lib/server/http/request";
import { ok } from "@/lib/server/http/responses";
import { appendSetCookies } from "@/lib/server/services/auth/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const verifySchema = z.object({
  challengeId: z.string().uuid(),
  code: z.string().regex(/^\d{6}$/),
}).strict();

export const POST = withApiHandler(async (request, context) => {
  const body = await parseJson(request, verifySchema, 8 * 1024);
  const config = getRuntimeConfig();
  const otpHmacKey = config.security.otpHmacKey;
  const credentialEncryptionKey = config.security.credentialEncryptionKey;
  if (!config.security.configured || !otpHmacKey || !credentialEncryptionKey) {
    throw new ApiError(503, "CAPABILITY_UNAVAILABLE", "Authentication security configuration is unavailable", {
      retryable: true,
    });
  }

  const result = await verifyOtpAndIssueSession({
    challengeId: body.challengeId,
    code: body.code,
    otpHmacKey,
    credentialEncryptionKey,
  });
  const response = ok(context, { user: result.user, memberships: result.memberships });
  return appendSetCookies(response, result.setCookie);
});
