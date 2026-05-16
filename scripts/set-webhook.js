import "dotenv/config";
import { config } from "../src/config.js";

const token = config.telegramBotToken;
const base = config.publicBaseUrl;
const secret = config.telegramWebhookSecret;

if (!token || !base) {
  console.error("Set TELEGRAM_BOT_TOKEN and PUBLIC_BASE_URL in .env first.");
  process.exit(1);
}

const url = `${base.replace(/\/$/, "")}/telegram/webhook`;
const body = {
  url,
  secret_token: secret || undefined,
  allowed_updates: ["message", "callback_query", "edited_message"],
};

const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

const data = await res.json();
if (!data.ok) {
  console.error(data);
  process.exit(1);
}
console.log("Webhook set to:", url);
console.log(data);
