import path from "node:path";
import { config } from "dotenv";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import router from "@repo/backend/router";

config({ path: path.join(process.cwd(), "../../.env") });

const apiBaseUrl = process.env.API_URL ?? "http://localhost:5001";
const cronSecret = process.env.CRON_SECRET ?? "";

const link = new RPCLink({
  url: `${apiBaseUrl}/api/rpc`,
  fetch: (request, init) =>
    fetch(
      new Request(request, {
        headers: { ...Object.fromEntries(request.headers.entries()), 'x-cron-secret': cronSecret },
      }),
      init,
    ),
});

const client: RouterClient<typeof router> = createORPCClient(link);

async function runDailyContentCycle() {
  const startedAt = Date.now();
  console.log(`[Cron] POST ${apiBaseUrl}/api/rpc/runDailyContentCycle ...`);
  const result = await client.runDailyContentCycle();
  console.log(
    `[Cron] Content cycle done in ${(result.durationMs / 1000).toFixed(1)}s - ${result.totalGenerated} items generated, ${result.skippedCount} projects skipped`,
  );
}

runDailyContentCycle()
  .then(() => {
    console.log("[Cron] Finished.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("🔴 [Cron] Fatal error:", err);
    process.exit(1);
  });
