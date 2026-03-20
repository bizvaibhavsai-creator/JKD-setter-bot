import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.string().default("development"),
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  AI_CONFIDENCE_THRESHOLD: z.coerce.number().min(0).max(1).default(0.8),
  INSTANTLY_API_KEY: z.string().min(1),
  INSTANTLY_BASE_URL: z.string().url().default("https://api.instantly.ai"),
  INSTANTLY_WEBHOOK_SECRET: z.string().min(1),
  GOOGLE_SHEET_ID: z.string().min(1),
  GOOGLE_SHEET_NAME: z.string().optional(),
  GOOGLE_DOC_ID: z.string().optional(),
  GOOGLE_SERVICE_ACCOUNT_JSON: z.string().min(1),
  PLAYBOOK_SOURCE: z.enum(["local", "google_doc"]).default("local"),
  PLAYBOOK_FILE_PATH: z.string().default("playbooks/response-handling.md"),
  CALENDAR_LINK: z.string().optional(),
  COMPANY_NAME: z.string().optional(),
  AGENT_NAME: z.string().optional(),
  AGENT_TITLE: z.string().optional(),
  DEFAULT_SENDER_NAME: z.string().optional()
});

const parsed = envSchema.parse(process.env);

function parseServiceAccount(raw: string) {
  const json = JSON.parse(raw) as {
    client_email: string;
    private_key: string;
  };

  return {
    ...json,
    private_key: json.private_key.replace(/\\n/g, "\n")
  };
}

export const config = {
  ...parsed,
  GOOGLE_SERVICE_ACCOUNT: parseServiceAccount(parsed.GOOGLE_SERVICE_ACCOUNT_JSON),
  PLAYBOOK_FILE_ABS_PATH: path.resolve(process.cwd(), parsed.PLAYBOOK_FILE_PATH)
};

export function readLocalPlaybook() {
  return fs.readFileSync(config.PLAYBOOK_FILE_ABS_PATH, "utf8");
}
