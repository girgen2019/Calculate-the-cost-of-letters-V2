# Telegram relay — setup

The ➤ button in the calculator sends the inscription, both prices and the event date as a **personal
Telegram message from your bot** to you and to anyone else who pressed Start in the bot.

```
Calculator ➤ → Google Apps Script (this folder, free) → Telegram bot → personal messages
```

The bot token is stored only in the script settings. It is never in the page code or in this repository.

## 1. Create the bot (Telegram)
1. Open **@BotFather** → `/newbot`.
2. Name, e.g. `Огненные буквы`; username ending with `bot`, e.g. `fire_letters_calc_bot`.
3. Keep the **token** (`1234567890:AAH…`) private.

## 2. Press Start
You and every other recipient open `t.me/<bot username>` and press **Start** once.
Telegram does not let a bot write to a person who has not started it.

## 3. Create the script (Google)
1. Go to <https://script.google.com> → **New project**, name it `Letters calculator relay`.
2. Delete the sample code, paste the whole [`Code.gs`](Code.gs), press **Save**.
3. ⚙️ **Project Settings** → **Script Properties** → **Add script property**:
   - `BOT_TOKEN` = the token from step 1
4. Back in the editor choose the function **`showChatIds`** → **Run** → allow access (Google asks once).
   **Execution log** shows lines like `chat_id: 123456789 — Name @username`.
5. Add one more script property:
   - `CHAT_IDS` = the ids separated by commas, e.g. `123456789,987654321`
6. Choose **`sendTestMessage`** → **Run**: everyone in `CHAT_IDS` gets a test message.

## 4. Publish the script
1. **Deploy** → **New deployment** → type **Web app**.
2. *Execute as*: **Me**. *Who has access*: **Anyone**.
3. **Deploy** → copy the **Web app URL** (`https://script.google.com/macros/s/…/exec`).

## 5. Connect the calculator
Put the URL into `TELEGRAM_RELAY_URL` at the top of `js_App-calc.js`. The ➤ button appears next to ✕.
The URL is not a secret: it can only send requests to *your* chats, and the script limits them.

## Protection
- 30 requests per hour in total, one per 30 s from a browser.
- Empty inscription, missing or past event date are rejected.
- A hidden honeypot field filters simple spam bots.

## Add or remove a person
The person presses Start in the bot → run `showChatIds` → edit `CHAT_IDS`. No code changes needed.
