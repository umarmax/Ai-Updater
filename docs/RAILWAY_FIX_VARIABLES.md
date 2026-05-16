# Railway: fix “Missing env vars” and site not working

## What the log means

| Log line | Meaning |
|----------|---------|
| `npm warn config production` | **Ignore** — not an error |
| `Missing env vars...` | Railway has **no secrets** yet (or wrong service) |
| `Listening on port 8080` | **Good** — app is running |
| `[webhook] Skip...` | Telegram is **not connected** until `TELEGRAM_BOT_TOKEN` is set |

The “site” is your Railway URL. It only works if:

1. You open the **Ai-Updater** service URL (not todo-list).
2. **Public networking** is enabled (Generate Domain).
3. **Variables** are on **Ai-Updater**, not Postgres or todo-list.

---

## Step 1 — Open the correct service

1. railway.app → your project.
2. Click **Ai-Updater** (GitHub icon) — **not** todo-list.
3. **Settings → Networking → Generate Domain** if you have no URL yet.
4. Copy the URL (example: `https://ai-updater-production-xxxx.up.railway.app`).

Test in browser:

- `https://YOUR-URL/` — setup checklist page  
- `https://YOUR-URL/health` — should show `"ok": true`  
- `https://YOUR-URL/status` — shows what is still missing  

If the browser says “can’t connect”, the domain is wrong or not generated for **Ai-Updater**.

---

## Step 2 — Add variables (Ai-Updater only)

**Ai-Updater** → **Variables** → add each (no quotes in Railway UI):

```
TELEGRAM_BOT_TOKEN=paste from BotFather
OPENAI_API_KEY=sk-paste from OpenAI
OPENAI_MODEL=gpt-4o
ALLOWED_DRIVER_TELEGRAM_IDS=111111111,222222222
DISPATCHER_CHAT_ID=your_telegram_id
TELEGRAM_WEBHOOK_SECRET=any-long-random-text
CONFIDENCE_THRESHOLD=85
```

**PUBLIC_BASE_URL** — optional if Railway gives you a domain; you can set:

```
PUBLIC_BASE_URL=https://ai-updater-production-xxxx.up.railway.app
```

(use your real URL, no `/` at the end)

Click **Deploy** or wait for auto-redeploy (~1–2 min).

---

## Step 3 — Confirm in logs

After redeploy, **Deploy Logs** should show:

- No `Missing env vars` list (or shorter list)
- `[webhook] Telegram will POST updates to: https://...`

---

## Step 4 — Telegram test

1. BotFather → `/setprivacy` → bot → **Disable**
2. Group with bot → message from allowed ID: `Load 1 at shpr`

---

## Common mistakes

1. Variables added to **todo-list** instead of **Ai-Updater**
2. Typo in variable **name** (`TELEGRAM_BOT_TOKEN` not `TELEGRAM_TOKEN`)
3. Extra spaces in values
4. Opening **todo-list** URL instead of **Ai-Updater** URL
5. OpenAI: no billing → bot fails after variables are set
