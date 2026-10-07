import { requireWriteActor } from "@/lib/server/auth/session";
import { withApiHandler } from "@/lib/server/http/handler";
import { parseJson } from "@/lib/server/http/request";
import { ApiError } from "@/lib/server/http/errors";
import { z } from "zod";

const translationPreviewSchema = z.object({
  text: z.string().trim().min(1).max(4000),
  sourceLocale: z.string().trim().regex(/^[a-z]{2}(?:-[A-Z]{2})?$/),
  targetLocale: z.string().trim().regex(/^[a-z]{2}(?:-[A-Z]{2})?$/),
  context: z.string().trim().max(1000).optional(),
}).strict();

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (request) => {
  await requireWriteActor(request, ["Owner", "Admin", "Agent"]);
  await parseJson(request, translationPreviewSchema, 8 * 1024);
  throw new ApiError(503, "TRANSLATION_PROVIDER_UNAVAILABLE", "Translation preview provider is not configured", { retryable: true });
});
