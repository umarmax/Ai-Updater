const TG = "https://api.telegram.org";

export async function telegramApi(method, body, token) {
  const res = await fetch(`${TG}/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!data.ok) {
    const desc = data.description || res.statusText;
    throw new Error(`Telegram ${method} failed: ${desc}`);
  }
  return data;
}

export function verifyWebhookSecret(req, expected) {
  if (!expected) return true;
  const got = req.get("X-Telegram-Bot-Api-Secret-Token");
  return got === expected;
}
