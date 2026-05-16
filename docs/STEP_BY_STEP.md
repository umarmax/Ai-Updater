# AI Updater Pro — step-by-step (no n8n / Make)

You **can** build this without visual automation tools: this repo is a small **Node.js** server that talks to **Telegram** and **OpenAI** directly. You will still use **websites** (OpenAI, Google Cloud, hosting) to copy keys and click buttons — no programming study required, but you must follow steps carefully.

---

## Part 0 — Which AI model to use?

| Model | When to use it |
|--------|----------------|
| **`gpt-4o`** | **Default for this project.** Best tradeoff for messy driver English, abbreviations, and short messages like “done”. |
| **`gpt-4o-mini`** | **Cheap tests** once your prompt and sheet columns are stable. Expect more mistakes on ambiguous texts. |
| **`gpt-5.x` / future flagship** | Fine if available in your account and **supports JSON schema / structured outputs** the same way — use the docs for that model. |

**Why not rely only on “the latest” name?** What matters is **reliable JSON** (we use OpenAI **JSON schema** mode) and **consistent behavior** on slang. Newer is not automatically better if it is worse at following the schema or more expensive.

**Confidence number:** The model outputs a **0–100** score in JSON (good for your **85%** rule). True statistical “logprobs” are optional and harder to explain; the JSON score is enough for an MVP.

Set the model in `.env`:

```env
OPENAI_MODEL=gpt-4o
```

---

## Part 1 — Install Node.js (one-time)

1. Open [https://nodejs.org](https://nodejs.org) in your browser.
2. Download the **LTS** version for Windows.
3. Run the installer; keep defaults.
4. Close and reopen **PowerShell** or **Command Prompt**.
5. Type `node -v` and press Enter — you should see `v20` or higher.

---

## Part 2 — Get the project on your PC

The folder should be:

`C:\Users\u\Projects\ai-updater-pro`

If you use Cursor: **File → Open Folder** and pick that path.

---

## Part 3 — Create the Telegram bot

1. In Telegram, open **@BotFather**.
2. Send `/newbot`, pick a name and username ending in `bot`.
3. Copy the **HTTP API token** → put it in `.env` as `TELEGRAM_BOT_TOKEN=...`
4. Send BotFather: `/setprivacy` → choose your bot → **Disable** (so the bot can read ordinary messages in a driver group — you still restrict **who** may trigger logic via `ALLOWED_DRIVER_TELEGRAM_IDS`).
5. Optional but recommended: `/setdomain` (or configure the **Menu Button** / **Web App** URL later) after you know your public HTTPS URL (Part 6).

---

## Part 4 — Collect Telegram IDs (numbers)

You need **numeric IDs** (not @usernames):

1. Ask each driver (and yourself as dispatcher) to message **@userinfobot** or **@getidsbot** in Telegram.
2. Put driver IDs in `.env`:

   `ALLOWED_DRIVER_TELEGRAM_IDS=111111111,222222222`

3. Put **your** dispatcher chat ID in:

   `DISPATCHER_CHAT_ID=your_id`

   (If you prefer a private admin group, add the bot there and use that **group chat id** — usually a negative number for supergroups.)

---

## Part 5 — OpenAI API key

1. Create/login at [https://platform.openai.com](https://platform.openai.com).
2. Billing: add a small credit card budget (this is normal for API use).
3. Create an **API key** → paste into `.env` as `OPENAI_API_KEY=...`
4. Set `OPENAI_MODEL=gpt-4o` (or `gpt-4o-mini` for cheap tests).

---

## Part 6 — Public HTTPS URL (required for Telegram)

Telegram **only** accepts webhooks on **https** with a valid certificate.

**Easiest for beginners:** deploy this app to **Railway**, **Render**, or **Fly.io** (they give you `https://...`). Steps differ per site; the pattern is always:

1. Push this folder to **GitHub** (private repo is fine).
2. Create a new Web Service from that repo.
3. Set **environment variables** in the dashboard (same names as `.env.example`).
4. The host sets `PORT` automatically — our server reads `process.env.PORT`.

Then fill:

```env
PUBLIC_BASE_URL=https://YOUR-HOSTNAME
```

On your PC (or in the host’s “run command” if they allow):

```bash
npm install
npm run set-webhook
```

That registers `https://YOUR-HOSTNAME/telegram/webhook` with Telegram.

Also set in `.env`:

```env
TELEGRAM_WEBHOOK_SECRET=some-long-random-text
```

Use the **same** value in BotFather’s webhook secret field if you set it there (Telegram sends it as a header; our server checks it).

---

## Part 7 — First local test (optional)

1. Copy `.env.example` to `.env` and fill at least: token, OpenAI key, allowed IDs, dispatcher id, `PUBLIC_BASE_URL` (can be a tunnel URL), model.
2. In the project folder run:

   ```bash
   npm install
   npm start
   ```

3. For a quick tunnel without deploying, you can use **Cloudflare Tunnel** or **ngrok** to expose `http://127.0.0.1:8787` — then put that HTTPS URL into `PUBLIC_BASE_URL` and run `npm run set-webhook` again.

---

## Part 8 — Google Sheets + Samsara (later)

- **Sheets:** create a Google Cloud **service account**, download JSON, place it in `credentials/`, share your spreadsheet with the service account email (Editor). Fill `GOOGLE_SHEET_ID`, paths, and tab names. The code currently **logs audit rows** and has a **TODO** to map your exact columns — that mapping is one short coding task or something we do together in Cursor.
- **Samsara:** add `SAMSARA_API_TOKEN` and implement `src/samsara.js` using your vehicle id column.

---

## Mini App (Web App)

- After `PUBLIC_BASE_URL` works, open in Telegram: the bot sends a **Web App** button on `/start` in private chat pointing to `/public/`.
- For production, you should add **server-side validation** of `initData` (Telegram docs) before trusting user id — we can add that next.

---

## What you do vs what the assistant does

| You | Assistant / Cursor |
|-----|---------------------|
| Accounts, billing, copying keys, BotFather clicks | Write / adjust code, explain errors |
| Deploy host, paste env vars there | Map sheet columns, Samsara vehicle lookup |
| Add bot to real driver group, test messages | Add Gmail broker emails, GPS distance checks |

When you are ready for the next increment, say: **“Sheet columns are: …”** and paste one example row header line.
