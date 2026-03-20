import { config } from "../config.js";
import { sendReply, updateLeadInterest, markThreadAsRead } from "../services/instantly.js";
import { classifyAndDraft } from "../services/openai.js";
import { loadPlaybookText } from "../services/playbook.js";
import { upsertReplyRow } from "../services/sheets.js";
import type { InstantlyWebhookEvent } from "../types.js";

export async function processReplyEvent(event: InstantlyWebhookEvent) {
  const playbook = await loadPlaybookText();
  const result = await classifyAndDraft(event, playbook);

  const shouldSend =
    event.event_type === "reply_received" &&
    !result.human_review_required &&
    result.confidence >= config.AI_CONFIDENCE_THRESHOLD &&
    event.email_id &&
    event.email_account;

  if (shouldSend) {
    await sendReply(event, result);
    await markThreadAsRead(String((event as Record<string, unknown>).thread_id ?? ""));
  }

  await updateLeadInterest(event, result);
  await upsertReplyRow(event, result, Boolean(shouldSend));

  return {
    shouldSend,
    result
  };
}
