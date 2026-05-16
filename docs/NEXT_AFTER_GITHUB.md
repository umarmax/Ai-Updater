# What to do after GitHub + Telegram bot (simple version)

You already did:
- GitHub (code online)
- Telegram bot + 2 user IDs

You still need **3 websites** (accounts only — you click and paste keys):

| # | Website | What it does |
|---|---------|----------------|
| 1 | **Railway** (or Render) | Runs your program 24/7 and gives you an **https://…** address |
| 2 | **OpenAI** | GPT-4o reads driver messages and returns JSON |
| 3 | *(later)* Google Sheets | Saves loads in a table — optional for first test |

There is **no separate “website” you design**. The “site” is just that **https address** where your Node.js app lives. Drivers still use **Telegram**; they never open a browser for the MVP.

---

## How everything connects (one picture in words)

```
Driver types in Telegram group
        ↓
Telegram sends message to YOUR server URL
  (https://something.railway.app/telegram/webhook)
        ↓
Your server (code from GitHub) calls OpenAI gpt-4o
        ↓
OpenAI returns: status + confidence %
        ↓
If confidence high → bot replies in group
If confidence low → message to DISPATCHER with buttons
```

**GitHub** = storage for code.  
**Railway** = computer that runs the code.  
**OpenAI** = brain that understands "at shpr".  
**Telegram** = chat app drivers already use.

---

## Step A — OpenAI key (10 minutes)

1. Go to [https://platform.openai.com](https://platform.openai.com) → sign in.
2. **Settings → Billing** → add a payment method (set a low monthly limit if you want).
3. **API keys** → **Create new secret key** → copy it (starts with `sk-`).
4. Keep it in Notepad for Step C — **never** put it in GitHub.

---

## Step B — Put the app on Railway (20 minutes)

1. Go to [https://railway.app](https://railway.app) → sign up with **GitHub** (same account as your repo).
2. **New Project** → **Deploy from GitHub repo** → choose **ai-updater-pro**.
3. Wait until deploy finishes (green / “Active”).
4. Open the service → **Settings** → **Networking** → **Generate Domain**.  
   You get something like: `https://ai-updater-pro-production-xxxx.up.railway.app`  
   Copy that — this is your **PUBLIC_BASE_URL** (no `/` at the end).

5. Open **Variables** and add these (paste your real values):

| Variable name | Your value |
|---------------|------------|
| `TELEGRAM_BOT_TOKEN` | from @BotFather |
| `OPENAI_API_KEY` | `sk-...` from OpenAI |
| `OPENAI_MODEL` | `gpt-4o` |
| `ALLOWED_DRIVER_TELEGRAM_IDS` | both trial IDs, comma: `111,222` |
| `DISPATCHER_CHAT_ID` | **your** Telegram number (one of the two IDs if you are the dispatcher) |
| `PUBLIC_BASE_URL` | the Railway https URL from step 4 |
| `TELEGRAM_WEBHOOK_SECRET` | any long random text, e.g. `mySecret2026Trial` |
| `CONFIDENCE_THRESHOLD` | `85` |

6. Railway will **redeploy** after you save variables. On startup the app **automatically** connects Telegram to your URL (no extra command).

7. Test in browser: open  
   `https://YOUR-RAILWAY-URL/health`  
   You should see: `{"ok":true,"service":"ai-updater-pro"}`

---

## Step C — Telegram bot in a group

1. In @BotFather: `/setprivacy` → your bot → **Disable** (so it can read group messages).
2. Create a **test group** in Telegram, add your bot as **admin** (helps in some groups).
3. Add yourself + second trial user.
4. From an **allowed** Telegram ID, send:  
   `Load 12345 at shpr`
5. You should get a **reply** from the bot within a few seconds.

If nothing happens, check Railway **Deploy Logs** for red errors (often wrong token or missing variable).

---

## Step D — Private chat with bot (optional)

1. Open a **private chat** with your bot.
2. Send `/start` — you may see a **Open driver panel** button (Mini App).  
   That page is only a small extra UI; the main trial is **group messages**.

---

## What I cannot do for you (needs your login)

- Create your OpenAI / Railway accounts
- Paste your secret keys (only you should see them)
- Add the bot to your real company group

What we **can** do together in Cursor: fix errors from Railway logs, map Google Sheets columns later.

---

## Checklist

- [ ] OpenAI API key + billing
- [ ] Railway project from GitHub repo
- [ ] Railway domain generated
- [ ] All variables in Railway (especially `PUBLIC_BASE_URL`)
- [ ] `/health` works in browser
- [ ] Bot privacy disabled in BotFather
- [ ] Test message from allowed user ID in group

When a step fails, send: screenshot of Railway **Variables** (hide secrets) + **Deploy Logs** last 20 lines.
