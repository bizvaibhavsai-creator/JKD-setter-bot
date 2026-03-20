import { config } from "../config.js";
import { getSheetsClient } from "./google.js";
import type { ClassificationResult, InstantlyWebhookEvent } from "../types.js";
import { classificationToInterestValue } from "./instantly.js";

const HEADERS = [
  "lead_id",
  "lead_email",
  "campaign_name",
  "email_account",
  "email_id",
  "thread_id",
  "classification",
  "sheet_status",
  "confidence",
  "reason",
  "reply_subject",
  "reply_body",
  "last_reply_text",
  "human_review_required",
  "instantly_interest_value",
  "reply_sent",
  "sent_at",
  "updated_at",
  "unibox_url"
] as const;

let resolvedSheetName: string | null = null;

async function getSheetName() {
  if (resolvedSheetName) {
    return resolvedSheetName;
  }

  if (config.GOOGLE_SHEET_NAME) {
    resolvedSheetName = config.GOOGLE_SHEET_NAME;
    return resolvedSheetName;
  }

  const sheets = await getSheetsClient();
  const response = await sheets.spreadsheets.get({
    spreadsheetId: config.GOOGLE_SHEET_ID
  });

  const firstSheetTitle = response.data.sheets?.[0]?.properties?.title;
  if (!firstSheetTitle) {
    throw new Error("Could not resolve a Google Sheet tab name");
  }

  resolvedSheetName = firstSheetTitle;
  return resolvedSheetName;
}

export async function ensureHeaderRow() {
  const sheets = await getSheetsClient();
  const sheetName = await getSheetName();
  const range = `${sheetName}!1:1`;

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: config.GOOGLE_SHEET_ID,
    range
  });

  const values = response.data.values?.[0] ?? [];
  const hasRequiredHeaders = HEADERS.every((header, index) => values[index] === header);

  if (hasRequiredHeaders) {
    return HEADERS;
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: config.GOOGLE_SHEET_ID,
    range,
    valueInputOption: "RAW",
    requestBody: {
      values: [Array.from(HEADERS)]
    }
  });

  return HEADERS;
}

export async function upsertReplyRow(
  event: InstantlyWebhookEvent,
  result: ClassificationResult,
  replySent: boolean
) {
  const sheets = await getSheetsClient();
  await ensureHeaderRow();
  const sheetName = await getSheetName();

  const range = `${sheetName}!A:S`;
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: config.GOOGLE_SHEET_ID,
    range
  });

  const rows = response.data.values ?? [];
  const dataRows = rows.slice(1);

  const lookupLeadId = String(event.lead_id ?? "").trim();
  const lookupEmail = String(event.lead_email ?? "").trim().toLowerCase();

  const rowIndex = dataRows.findIndex((row) => {
    const rowLeadId = String(row[0] ?? "").trim();
    const rowEmail = String(row[1] ?? "").trim().toLowerCase();
    return (lookupLeadId && rowLeadId === lookupLeadId) || (lookupEmail && rowEmail === lookupEmail);
  });

  const now = new Date().toISOString();
  const values = [
    String(event.lead_id ?? ""),
    event.lead_email ?? "",
    event.campaign_name ?? "",
    event.email_account ?? "",
    event.email_id ?? "",
    String((event as Record<string, unknown>).thread_id ?? ""),
    result.classification,
    result.sheet_status,
    result.confidence.toString(),
    result.reason,
    result.reply_subject,
    result.reply_body,
    event.reply_text ?? event.reply_text_snippet ?? "",
    result.human_review_required ? "yes" : "no",
    String(classificationToInterestValue(result.classification) ?? ""),
    replySent ? "yes" : "no",
    replySent ? now : "",
    now,
    event.unibox_url ?? ""
  ];

  if (rowIndex >= 0) {
    const targetRow = rowIndex + 2;
    await sheets.spreadsheets.values.update({
      spreadsheetId: config.GOOGLE_SHEET_ID,
      range: `${sheetName}!A${targetRow}:S${targetRow}`,
      valueInputOption: "RAW",
      requestBody: {
        values: [values]
      }
    });
    return { action: "updated", row: targetRow };
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId: config.GOOGLE_SHEET_ID,
    range,
    valueInputOption: "RAW",
    requestBody: {
      values: [values]
    }
  });

  return { action: "appended" };
}
