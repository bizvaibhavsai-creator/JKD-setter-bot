import { config } from "../config.js";
import type { ClassificationResult, InstantlyWebhookEvent } from "../types.js";

async function instantlyFetch<T>(pathname: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${config.INSTANTLY_BASE_URL}${pathname}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.INSTANTLY_API_KEY}`,
      "Content-Type": "application/json",
      ...(init?.headers || {})
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Instantly API ${pathname} failed: ${response.status} ${text}`);
  }

  return (await response.json()) as T;
}

export async function sendReply(
  event: InstantlyWebhookEvent,
  result: ClassificationResult
) {
  if (!event.email_id) {
    throw new Error("Instantly webhook payload is missing email_id");
  }

  if (!event.email_account) {
    throw new Error("Instantly webhook payload is missing email_account");
  }

  return instantlyFetch("/api/v2/emails/reply", {
    method: "POST",
    body: JSON.stringify({
      eaccount: event.email_account,
      reply_to_uuid: event.email_id,
      subject: result.reply_subject,
      body: {
        text: result.reply_body,
        html: result.reply_body
          .split("\n")
          .map((line) => `<p>${escapeHtml(line)}</p>`)
          .join("")
      }
    })
  });
}

export async function markThreadAsRead(threadId?: string) {
  if (!threadId) {
    return null;
  }

  return instantlyFetch(`/api/v2/emails/threads/${threadId}/mark-as-read`, {
    method: "POST"
  });
}

export async function updateLeadInterest(
  event: InstantlyWebhookEvent,
  result: ClassificationResult
) {
  if (!event.lead_email) {
    return null;
  }

  const interestValue = classificationToInterestValue(result.classification);
  if (interestValue === undefined) {
    return null;
  }

  return instantlyFetch("/api/v2/leads/update-interest-status", {
    method: "POST",
    body: JSON.stringify({
      lead_email: event.lead_email,
      campaign_id: event.campaign_id,
      interest_value: interestValue,
      ai_interest_value: result.confidence,
      disable_auto_interest: true
    })
  });
}

export async function createReplyWebhook(publicBaseUrl: string) {
  const target = `${publicBaseUrl.replace(/\/$/, "")}/webhooks/instantly?token=${encodeURIComponent(config.INSTANTLY_WEBHOOK_SECRET)}`;

  return instantlyFetch("/api/v2/webhooks", {
    method: "POST",
    body: JSON.stringify({
      target_hook_url: target,
      name: "JKD Setter Agent",
      event_type: "reply_received",
      campaign: null
    })
  });
}

export function classificationToInterestValue(classification: ClassificationResult["classification"]) {
  switch (classification) {
    case "interested":
    case "meeting_request":
      return 1;
    case "not_interested":
    case "complaint_angry":
    case "positive_no":
      return -1;
    case "out_of_office":
      return 0;
    case "wrong_person":
      return -2;
    default:
      return undefined;
  }
}

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
