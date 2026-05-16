import "dotenv/config";

function parseIdList(raw) {
  if (!raw || !String(raw).trim()) return [];
  return String(raw)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => Number(s));
}

function resolvePublicBaseUrl() {
  const fromEnv = (process.env.PUBLIC_BASE_URL || "").replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  const railwayHost = process.env.RAILWAY_PUBLIC_DOMAIN;
  if (railwayHost) return `https://${railwayHost.replace(/\/$/, "")}`;
  return "";
}

export const config = {
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || "",
  telegramWebhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || "",
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  openaiModel: process.env.OPENAI_MODEL || "gpt-4o",
  allowedDriverTelegramIds: new Set(
    parseIdList(process.env.ALLOWED_DRIVER_TELEGRAM_IDS)
  ),
  allowedGroupChatId: process.env.ALLOWED_GROUP_CHAT_ID
    ? Number(process.env.ALLOWED_GROUP_CHAT_ID)
    : null,
  confidenceThreshold: Number(process.env.CONFIDENCE_THRESHOLD || 85),
  dispatcherChatId: process.env.DISPATCHER_CHAT_ID
    ? Number(process.env.DISPATCHER_CHAT_ID)
    : null,
  publicBaseUrl: resolvePublicBaseUrl(),
  port: Number(process.env.PORT || 8787),
  googleSheetId: process.env.GOOGLE_SHEET_ID || "",
  googleSheetTab: process.env.GOOGLE_SHEET_TAB || "Loads",
  googleAuditTab: process.env.GOOGLE_AUDIT_TAB || "Audit",
  googleApplicationCredentials: process.env.GOOGLE_APPLICATION_CREDENTIALS || "",
  samsaraApiToken: process.env.SAMSARA_API_TOKEN || "",
};

export function assertConfig() {
  const missing = [];
  if (!config.telegramBotToken) missing.push("TELEGRAM_BOT_TOKEN");
  if (!config.openaiApiKey) missing.push("OPENAI_API_KEY");
  if (config.allowedDriverTelegramIds.size === 0) {
    missing.push("ALLOWED_DRIVER_TELEGRAM_IDS");
  }
  if (!config.dispatcherChatId) missing.push("DISPATCHER_CHAT_ID");
  if (!config.publicBaseUrl) {
    missing.push("PUBLIC_BASE_URL (or enable Railway public domain)");
  }
  return missing;
}

export function configStatus() {
  const missing = assertConfig();
  return {
    ready: missing.length === 0,
    missing,
    publicBaseUrl: config.publicBaseUrl || null,
    openaiModel: config.openaiModel,
    allowedDriversCount: config.allowedDriverTelegramIds.size,
    hasDispatcher: Boolean(config.dispatcherChatId),
    hasTelegramToken: Boolean(config.telegramBotToken),
    hasOpenaiKey: Boolean(config.openaiApiKey),
  };
}
