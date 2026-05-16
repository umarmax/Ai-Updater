import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { config, assertConfig } from "./config.js";
import { parseDriverMessage } from "./openai-parse.js";
import { telegramApi, verifyWebhookSecret } from "./telegram.js";
import { logAuditRow, applyStatusUpdate } from "./sheets.js";
import { fetchVehicleGpsHint } from "./samsara.js";
import { registerTelegramWebhook } from "./register-webhook.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pending = new Map();

function makeCallbackToken() {
  return [...crypto.getRandomValues(new Uint8Array(6))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "512kb" }));
app.use("/public", express.static(path.join(__dirname, "..", "public")));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "ai-updater-pro" });
});

app.get("/", (_req, res) => {
  res.type("html").send(`<!doctype html><meta charset="utf-8">
  <title>AI Updater Pro</title>
  <p>Server is running. Open the Telegram Mini App from your bot button, or POST webhooks to <code>/telegram/webhook</code>.</p>`);
});

app.post("/telegram/webhook", async (req, res) => {
  if (!verifyWebhookSecret(req, config.telegramWebhookSecret)) {
    return res.status(401).send("Unauthorized");
  }
  try {
    await handleTelegramUpdate(req.body);
  } catch (e) {
    console.error(e);
  }
  res.sendStatus(200);
});

async function handleTelegramUpdate(update) {
  if (update.callback_query) {
    await handleCallback(update.callback_query);
    return;
  }
  const msg = update.message || update.edited_message;
  if (!msg || !msg.text) return;

  const chatId = msg.chat?.id;
  const fromId = msg.from?.id;
  const text = msg.text.trim();

  if (msg.chat?.type === "private" && text === "/start") {
    await telegramApi(
      "sendMessage",
      {
        chat_id: chatId,
        text: "AI Updater Pro is online. Use the Mini App button (set in BotFather) or write statuses in the driver group.",
        reply_markup: config.publicBaseUrl
          ? {
              inline_keyboard: [
                [
                  {
                    text: "Open driver / dispatcher panel",
                    web_app: { url: `${config.publicBaseUrl}/public/` },
                  },
                ],
              ],
            }
          : undefined,
      },
      config.telegramBotToken
    );
    return;
  }

  if (!fromId) return;
  if (!config.allowedDriverTelegramIds.has(fromId)) return;
  if (
    config.allowedGroupChatId &&
    chatId &&
    chatId !== config.allowedGroupChatId
  ) {
    return;
  }

  const driverName =
    [msg.from.first_name, msg.from.last_name].filter(Boolean).join(" ") ||
    msg.from.username ||
    String(fromId);

  const parsed = await parseDriverMessage({
    apiKey: config.openaiApiKey,
    model: config.openaiModel,
    userText: text,
    driverDisplayName: driverName,
    recentContextLines: [],
  });

  const gpsHint = await fetchVehicleGpsHint();
  console.log("[gps]", gpsHint);

  const confident = Number(parsed.Confidence) >= config.confidenceThreshold;
  const actionable = parsed.Status !== "Unknown" && confident;

  if (actionable) {
    await applyStatusUpdate(parsed);
    await logAuditRow({
      source: "AI_AUTO",
      parsed,
      note: "Auto path (Sheets update is TODO until columns are mapped).",
    });
    await telegramApi(
      "sendMessage",
      {
        chat_id: chatId,
        reply_to_message_id: msg.message_id,
        text: `Parsed (${parsed.Confidence}%): ${parsed.Status}${
          parsed.LoadID ? ` — Load ${parsed.LoadID}` : ""
        }. Sheet update runs when you finish column mapping in code.`,
      },
      config.telegramBotToken
    );
    return;
  }

  const token = makeCallbackToken();
  pending.set(token, {
    chatId,
    driverMessageId: msg.message_id,
    originalText: text,
    parsed,
    fromId,
    driverName,
  });

  const keyboard = {
    inline_keyboard: [
      [
        { text: "Delivered", callback_data: `r:${token}:Delivered` },
        { text: "Empty", callback_data: `r:${token}:Empty` },
      ],
      [
        {
          text: "Arrived at Consignee",
          callback_data: `r:${token}:Arrived at Consignee`,
        },
      ],
      [{ text: "Other / Unknown", callback_data: `r:${token}:Unknown` }],
    ],
  };

  await telegramApi(
    "sendMessage",
    {
      chat_id: config.dispatcherChatId,
      text:
        `⚠ Clarification needed (${parsed.Confidence}%)\n` +
        `Driver: ${driverName} (tg ${fromId})\n` +
        `Wrote: ${text}\n` +
        `AI guess: ${parsed.Status}\n` +
        `Notes: ${parsed.Notes || "—"}`,
      reply_markup: keyboard,
    },
    config.telegramBotToken
  );

  await telegramApi(
    "sendMessage",
    {
      chat_id: chatId,
      reply_to_message_id: msg.message_id,
      text: "Received. Dispatcher is confirming your status (low AI confidence or ambiguous wording).",
    },
    config.telegramBotToken
  );
}

async function handleCallback(q) {
  const data = q.data || "";
  const m = /^r:([^:]+):(.+)$/.exec(data);
  if (!m) {
    await telegramApi(
      "answerCallbackQuery",
      { callback_query_id: q.id, text: "Unknown action" },
      config.telegramBotToken
    );
    return;
  }
  const [, token, choice] = m;
  const payload = pending.get(token);
  if (!payload) {
    await telegramApi(
      "answerCallbackQuery",
      { callback_query_id: q.id, text: "This request expired." },
      config.telegramBotToken
    );
    return;
  }

  pending.delete(token);

  const merged = {
    ...payload.parsed,
    Status: choice,
    Confidence: 100,
    Notes: `Dispatcher choice: ${choice}`,
  };

  await applyStatusUpdate(merged);
  await logAuditRow({
    source: "DISPATCHER_BUTTON",
    parsed: merged,
    note: `Dispatcher tg ${q.from?.id}`,
  });

  await telegramApi(
    "answerCallbackQuery",
    { callback_query_id: q.id, text: "Saved" },
    config.telegramBotToken
  );

  if (q.message?.message_id) {
    await telegramApi(
      "editMessageText",
      {
        chat_id: q.message.chat.id,
        message_id: q.message.message_id,
        text:
          (q.message.text || "") +
          `\n\n✅ Dispatcher selected: ${choice}`,
      },
      config.telegramBotToken
    );
  }

  await telegramApi(
    "sendMessage",
    {
      chat_id: payload.chatId,
      text: `Dispatcher confirmed status: ${choice}`,
    },
    config.telegramBotToken
  );
}

const missing = assertConfig();
if (missing.length) {
  console.warn(
    "Missing env vars (copy .env.example to .env and fill):\n- " +
      missing.join("\n- ")
  );
}

app.listen(config.port, async () => {
  console.log(`Listening on port ${config.port}`);
  await registerTelegramWebhook();
});
