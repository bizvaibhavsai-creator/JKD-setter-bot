import { google } from "googleapis";
import { config } from "../config.js";

const auth = new google.auth.GoogleAuth({
  credentials: config.GOOGLE_SERVICE_ACCOUNT,
  scopes: [
    "https://www.googleapis.com/auth/documents.readonly",
    "https://www.googleapis.com/auth/spreadsheets"
  ]
});

export async function getDocsClient() {
  return google.docs({ version: "v1", auth });
}

export async function getSheetsClient() {
  return google.sheets({ version: "v4", auth });
}
