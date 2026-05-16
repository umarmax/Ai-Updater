import { config } from "./config.js";

/** Tell Telegram to send all updates to our server (runs once on startup). */
export async function registerTelegramWebhook() {
  if (!config.telegramBotToken || !config.publicBaseUrl) {
    console.warn(
      "[webhook] Skip: set TELEGRAM_BOT_TOKEN and PUBLIC_BASE_URL on your host."
    );
    return;
  }

  const url = `${config.publicBaseUrl}/telegram/webhook`;
  const body = {
    url,
    allowed_updates: ["message", "callback_query", "edited_message"],
  };
  if (config.telegramWebhookSecret) {
    body.secret_token = config.telegramWebhookSecret;
  }

  const res = await fetch(
    `https://api.telegram.org/bot${config.telegramBotToken}/setWebhook`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  const data = await res.json();
  if (!data.ok) {
    console.error("[webhook] setWebhook failed:", data);
    return;
  }
  console.log("[webhook] Telegram will POST updates to:", url);
}
