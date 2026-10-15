import { setTimeout } from "node:timers/promises";

import { getRuntimeConfig } from "../lib/server/config/env";
import { runWhatsAppWorkerOnce } from "../lib/server/integrations/whatsapp/operations";

const IDLE_INTERVAL_MS = 2000;

async function main() {
  const controller = new AbortController();
  process.on("SIGINT", () => controller.abort());
  process.on("SIGTERM", () => controller.abort());

  const config = getRuntimeConfig();
  if (!config.whatsapp.appSecret || !config.whatsapp.verifyToken || !config.whatsapp.graphApiVersion) {
    console.error("WhatsApp worker cannot start: WHATSAPP_APP_SECRET and WHATSAPP_VERIFY_TOKEN are required, and WHATSAPP_GRAPH_API_VERSION must be a valid version such as v25.0");
    process.exitCode = 1;
    return;
  }
  console.log(`WhatsApp worker started with Graph API ${config.whatsapp.graphApiVersion}; test messages only reach allowlisted recipients`);

  while (!controller.signal.aborted) {
    try {
      const summary = await runWhatsAppWorkerOnce();
      if (summary.claimed > 0) {
        console.log(`WhatsApp worker handled ${summary.claimed}: ${summary.succeeded} succeeded, ${summary.retried} retried, ${summary.failed} failed`);
      }
    } catch {
      console.error("WhatsApp worker cycle failed; database unavailable, nothing was sent");
    }
    try {
      await setTimeout(IDLE_INTERVAL_MS, undefined, { signal: controller.signal });
    } catch (error) {
      if (!controller.signal.aborted) throw error;
    }
  }
}

main().catch(() => {
  console.error("WhatsApp worker startup failed; check configuration");
  process.exitCode = 1;
});
