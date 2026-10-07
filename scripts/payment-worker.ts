import { setTimeout } from "node:timers/promises";

import { paymentServices } from "../lib/server/payments/service";
import { reconcile } from "../lib/server/payments/reconcile";

async function main() {
  const controller = new AbortController();
  process.on("SIGINT", () => controller.abort());
  process.on("SIGTERM", () => controller.abort());
  const { repository, chain } = paymentServices();
  console.log("Devnet reconciliation worker started; test credits only");
  while (!controller.signal.aborted) {
    try {
      for (const order of await repository.pending()) {
        if (controller.signal.aborted) break;
        try { await reconcile(order, chain, repository); }
        catch { await repository.checked(order.id); console.error(`Reconciliation failed for order ${order.id}; will retry`); }
      }
    } catch { console.error("Payment database unavailable; no credits granted"); }
    try { await setTimeout(5000, undefined, { signal: controller.signal }); }
    catch (error) { if (!controller.signal.aborted) throw error; }
  }
}
main().catch(() => { console.error("Worker startup failed; check payment configuration"); process.exitCode = 1; });
