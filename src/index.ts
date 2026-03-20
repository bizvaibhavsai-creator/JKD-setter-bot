import "dotenv/config";
import express from "express";
import { config } from "./config.js";
import { processReplyEvent } from "./agent/processReply.js";
import { instantlyWebhookSchema } from "./types.js";

const app = express();

app.use(express.json({ limit: "1mb" }));

app.get("/healthz", (_req, res) => {
  res.json({
    ok: true,
    service: "jkd-setter-agent",
    now: new Date().toISOString()
  });
});

app.post("/webhooks/instantly", async (req, res) => {
  try {
    const token = String(req.query.token || "");
    if (token !== config.INSTANTLY_WEBHOOK_SECRET) {
      return res.status(401).json({ ok: false, error: "invalid_token" });
    }

    const event = instantlyWebhookSchema.parse(req.body);

    if (!["reply_received", "auto_reply_received"].includes(event.event_type)) {
      return res.json({ ok: true, skipped: true, reason: "unsupported_event_type" });
    }

    if (!event.reply_text && !event.reply_text_snippet) {
      return res.json({ ok: true, skipped: true, reason: "missing_reply_text" });
    }

    const processed = await processReplyEvent(event);

    return res.json({
      ok: true,
      classification: processed.result.classification,
      confidence: processed.result.confidence,
      reply_sent: processed.shouldSend,
      human_review_required: processed.result.human_review_required
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "unknown_error"
    });
  }
});

app.listen(config.PORT, () => {
  console.log(`JKD Setter Agent listening on port ${config.PORT}`);
});
