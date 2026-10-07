import { requireWriteActor } from "@/lib/server/auth/session";
import { withApiHandler } from "@/lib/server/http/handler";
import { knowledgeCapabilityUnavailable } from "@/lib/server/services/knowledge/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (request) => {
  await requireWriteActor(request, ["Owner", "Admin"]);
  knowledgeCapabilityUnavailable("translation");
});
