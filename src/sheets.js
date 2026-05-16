import { google } from "googleapis";
import { config } from "./config.js";

let sheetsClientPromise;

async function getSheetsClient() {
  if (!config.googleSheetId || !config.googleApplicationCredentials) {
    return null;
  }
  if (!sheetsClientPromise) {
    const auth = new google.auth.GoogleAuth({
      keyFile: config.googleApplicationCredentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const authClient = await auth.getClient();
    sheetsClientPromise = google.sheets({ version: "v4", auth: authClient });
  }
  return sheetsClientPromise;
}

/**
 * Append a row to an "Audit" tab (creates tab if missing — simplified: append to Loads if no Audit).
 * Non-coders: adjust column layout to match your real sheet.
 */
export async function logAuditRow(payload) {
  const sheets = await getSheetsClient();
  if (!sheets) {
    console.log("[sheets] skipped (no GOOGLE_SHEET_ID or credentials):", payload);
    return;
  }
  const range = `${config.googleAuditTab}!A1`;
  const values = [
    [
      new Date().toISOString(),
      payload.source || "",
      JSON.stringify(payload.parsed || {}),
      payload.note || "",
    ],
  ];
  await sheets.spreadsheets.values.append({
    spreadsheetId: config.googleSheetId,
    range,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values },
  });
}

export async function applyStatusUpdate(/* parsed, driverRowHint */) {
  const sheets = await getSheetsClient();
  if (!sheets) {
    console.log("[sheets] applyStatusUpdate skipped — configure Google Sheets in .env");
    return;
  }
  // TODO: find row by LoadID + Driver, then spreadsheets.values.update
  console.log("[sheets] TODO: map parsed JSON to your column indices and update row");
}
