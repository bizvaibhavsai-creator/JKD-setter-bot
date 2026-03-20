import { z } from "zod";

export const instantlyWebhookSchema = z.object({
  timestamp: z.string().optional(),
  event_type: z.string(),
  workspace: z.string().optional(),
  campaign_id: z.string().optional(),
  campaign_name: z.string().optional(),
  lead_email: z.string().email().optional(),
  email_account: z.string().optional(),
  unibox_url: z.string().optional(),
  email_id: z.string().optional(),
  email_subject: z.string().optional(),
  email_text: z.string().optional(),
  email_html: z.string().optional(),
  reply_text_snippet: z.string().optional(),
  reply_subject: z.string().optional(),
  reply_text: z.string().optional(),
  reply_html: z.string().optional(),
  lead_id: z.union([z.string(), z.number()]).optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  company_name: z.string().optional()
}).passthrough();

export type InstantlyWebhookEvent = z.infer<typeof instantlyWebhookSchema>;

export const classificationSchema = z.object({
  classification: z.enum([
    "interested",
    "not_interested",
    "info_request",
    "out_of_office",
    "referral",
    "maybe_later",
    "objection",
    "wrong_person",
    "meeting_request",
    "complaint_angry",
    "bounced_invalid",
    "competitive",
    "conditional",
    "positive_no",
    "follow_up_needed"
  ]),
  sheet_status: z.string().min(1),
  confidence: z.number().min(0).max(1),
  reason: z.string().min(1),
  human_review_required: z.boolean(),
  reply_subject: z.string().min(1),
  reply_body: z.string().min(1)
});

export type ClassificationResult = z.infer<typeof classificationSchema>;
