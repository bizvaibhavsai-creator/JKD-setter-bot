import { config, readLocalPlaybook } from "../config.js";
import { getDocsClient } from "./google.js";

function extractDocText(content: unknown): string[] {
  const out: string[] = [];

  function visit(value: unknown) {
    if (!value) {
      return;
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) {
        out.push(trimmed);
      }
      return;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        visit(item);
      }
      return;
    }

    if (typeof value === "object") {
      for (const nested of Object.values(value)) {
        visit(nested);
      }
    }
  }

  visit(content);
  return out;
}

export async function loadPlaybookText() {
  if (config.PLAYBOOK_SOURCE === "local") {
    return readLocalPlaybook();
  }

  if (!config.GOOGLE_DOC_ID) {
    throw new Error("GOOGLE_DOC_ID is required when PLAYBOOK_SOURCE=google_doc");
  }

  const docs = await getDocsClient();
  const response = await docs.documents.get({
    documentId: config.GOOGLE_DOC_ID
  });

  return extractDocText(response.data.body?.content ?? []).join("\n").slice(0, 30000);
}
