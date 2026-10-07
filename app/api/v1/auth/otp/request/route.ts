import { z } from "zod";

import { requestOtp } from "@/lib/server/auth/otp";
import { createHttpOtpDeliveryProvider } from "@/lib/server/auth/otp-provider";
import { getRuntimeConfig } from "@/lib/server/config/env";
import { accepted } from "@/lib/server/http/responses";
import { parseJson, requireHeader } from "@/lib/server/http/request";
import { withApiHandler } from "@/lib/server/http/handler";
import { hashRequestIp } from "@/lib/server/services/auth/service";
import { ApiError } from "@/lib/server/http/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  email: z.string().trim().email().max(254),
  locale: z.string().trim().min(2).max(16).regex(/^[A-Za-z0-9_-]+$/),
}).strict();

export const POST = withApiHandler(async (request, context) => {
  const config = getRuntimeConfig();
  const encryptionKey = config.security.credentialEncryptionKey;
  const otpHmacKey = config.security.otpHmacKey;
  if (!config.otpDelivery.configured || !config.security.configured || !encryptionKey || !otpHmacKey) {
    throw new ApiError(503, "CAPABILITY_UNAVAILABLE", "OTP delivery or security configuration is unavailable", {
      retryable: true,
    });
  }
  const body = await parseJson(request, requestSchema, 8 * 1024);
  const idempotencyKey = requireHeader(request, "Idempotency-Key");

  const result = await requestOtp({
    email: body.email,
    locale: body.locale,
    idempotencyKey,
    credentialEncryptionKey: encryptionKey,
    otpHmacKey,
    requestIpHash: hashRequestIp(request, otpHmacKey, config.trustProxyHeaders),
    provider: createHttpOtpDeliveryProvider({
      endpoint: config.otpDelivery.endpoint ?? undefined,
      bearerToken: config.otpDelivery.bearerToken ?? undefined,
    }),
  });

  if (result.deliveryStatus !== "sent") {
    throw new ApiError(503, "OTP_DELIVERY_UNKNOWN", "OTP email delivery was not confirmed", {
      retryable: true,
      headers: { "Retry-After": String(result.retryAfterSeconds) },
      details: {
        challengeId: result.challengeId,
        expiresAt: result.expiresAt,
        deliveryStatus: result.deliveryStatus,
        retryMode: "new_idempotency_key",
      },
    });
  }

  return accepted(context, {
    challengeId: result.challengeId,
    expiresAt: result.expiresAt,
    retryAfterSeconds: result.retryAfterSeconds,
    deliveryStatus: result.deliveryStatus,
  });
});
