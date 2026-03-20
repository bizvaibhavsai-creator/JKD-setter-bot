import OpenAI from "openai";
import { config } from "../config.js";
import { classificationSchema, type ClassificationResult, type InstantlyWebhookEvent } from "../types.js";

const client = new OpenAI({
  apiKey: config.OPENAI_API_KEY
});

function buildPrompt(event: InstantlyWebhookEvent, playbook: string) {
  const prospectName = [event.first_name, event.last_name].filter(Boolean).join(" ").trim() || "there";

  return `
You are an expert cold-email setter assistant.

Your job:
1. Read the inbound reply.
2. Classify it into one supported label.
3. Draft a concise human reply using the playbook.
4. Decide whether human review is needed.
5. Return JSON only.

Important:
- Mirror the tone of the prospect.
- Never sound robotic.
- If they want to stop receiving emails, be brief, polite, and compliant.
- If they ask for a meeting, move the conversation toward booking.
- If the message is clearly auto-reply / OOO, do not pretend a conversation is happening.
- If unsure, set human_review_required=true.
- Keep replies short.

Company context:
- Company: ${config.COMPANY_NAME || "Our company"}
- Agent name: ${config.AGENT_NAME || config.DEFAULT_SENDER_NAME || "Sales Team"}
- Agent title: ${config.AGENT_TITLE || "Team"}
- Calendar link: ${config.CALENDAR_LINK || "Not provided"}

Prospect context:
- Prospect: ${prospectName}
- Lead email: ${event.lead_email || ""}
- Campaign: ${event.campaign_name || ""}
- Subject: ${event.reply_subject || event.email_subject || ""}
- Sender account: ${event.email_account || ""}

Inbound reply:
${event.reply_text || event.reply_text_snippet || ""}

Playbook:
${playbook}

Return JSON with exactly:
{
  "classification": "interested | not_interested | info_request | out_of_office | referral | maybe_later | objection | wrong_person | meeting_request | complaint_angry | bounced_invalid | competitive | conditional | positive_no | follow_up_needed",
  "sheet_status": "short human-readable status",
  "confidence": 0.0,
  "reason": "one short sentence",
  "human_review_required": false,
  "reply_subject": "subject",
  "reply_body": "body"
}
`.trim();
}

export async function classifyAndDraft(
  event: InstantlyWebhookEvent,
  playbook: string
): Promise<ClassificationResult> {
  const completion = await client.chat.completions.create({
    model: config.OPENAI_MODEL,
    temperature: 0.2,
    response_format: {
      type: "json_object"
    },
    messages: [
      {
        role: "system",
        content: "You produce only valid JSON."
      },
      {
        role: "user",
        content: buildPrompt(event, playbook)
      }
    ]
  });

  const content = completion.choices[0]?.message?.content ?? "{}";
  const parsed = classificationSchema.parse(JSON.parse(content));

  return parsed;
}
