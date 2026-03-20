import "dotenv/config";
import { config } from "../config.js";
import { createReplyWebhook } from "../services/instantly.js";

async function main() {
  const publicBaseUrl = process.env.PUBLIC_BASE_URL;

  if (!publicBaseUrl) {
    throw new Error("PUBLIC_BASE_URL is required");
  }

  const response = await createReplyWebhook(publicBaseUrl);
  console.log(JSON.stringify(response, null, 2));
  console.log(
    `Webhook target: ${publicBaseUrl.replace(/\/$/, "")}/webhooks/instantly?token=${encodeURIComponent(
      config.INSTANTLY_WEBHOOK_SECRET
    )}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
