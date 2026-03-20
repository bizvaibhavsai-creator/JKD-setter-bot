import { config } from "../config.js";
import { processReplyEvent } from "../agent/processReply.js";
import { instantlyWebhookSchema } from "../types.js";

type WebhookRequest = {
  token?: string;
  body: unknown;
};

export async function handleInstantlyWebhookRequest({ token, body }: WebhookRequest) {
  try {
    if (String(token || "") !== config.INSTANTLY_WEBHOOK_SECRET) {
      return {
        status: 401,
        body: { ok: false, error: "invalid_token" }
      };
    }

    const event = instantlyWebhookSchema.parse(body);

    if (!["reply_received", "auto_reply_received"].includes(event.event_type)) {
      return {
        status: 200,
        body: { ok: true, skipped: true, reason: "unsupported_event_type" }
      };
    }

    if (!event.reply_text && !event.reply_text_snippet) {
      return {
        status: 200,
        body: { ok: true, skipped: true, reason: "missing_reply_text" }
      };
    }

    const processed = await processReplyEvent(event);

    return {
      status: 200,
      body: {
        ok: true,
        classification: processed.result.classification,
        confidence: processed.result.confidence,
        reply_sent: processed.shouldSend,
        human_review_required: processed.result.human_review_required
      }
    };
  } catch (error) {
    console.error(error);
    return {
      status: 500,
      body: {
        ok: false,
        error: error instanceof Error ? error.message : "unknown_error"
      }
    };
  }
}
