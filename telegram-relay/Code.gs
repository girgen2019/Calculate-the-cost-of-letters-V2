/**
 * Telegram relay for the Letters Cost Calculator (Google Apps Script web app).
 *
 * The calculator page POSTs a request here; this script sends it as a personal Telegram message
 * from your bot to every chat id in CHAT_IDS. The bot token lives only in the Script Properties,
 * never in the page code.
 *
 * Script Properties (Project Settings -> Script Properties):
 *   BOT_TOKEN  - token from @BotFather
 *   CHAT_IDS   - comma-separated chat ids of the people who pressed Start in the bot
 *
 * Setup steps are in telegram-relay/README.md.
 */

var MAX_PER_HOUR = 30;      // all requests together: protects your Telegram from spam
var MAX_TEXT_LENGTH = 120;  // inscription length limit

/** The calculator sends a POST with a JSON body (as text/plain, so the browser makes no CORS preflight). */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // Honeypot: the page never fills this field, simple bots do
    if (data.website) return reply({ ok: true });

    var error = validate(data);
    if (error) return reply({ ok: false, error: error });

    if (!takeRateLimit()) return reply({ ok: false, error: 'Too many requests, try again later' });

    var sent = sendToAll(formatMessage(data));
    return reply({ ok: sent > 0, sent: sent, error: sent > 0 ? undefined : 'Telegram did not accept the message' });
  } catch (err) {
    return reply({ ok: false, error: 'Bad request' });
  }
}

/** Opening the web app URL in a browser just says it works (no secrets are shown). */
function doGet() {
  return reply({ ok: true, service: 'letters-calculator-telegram-relay' });
}

function validate(d) {
  if (typeof d.inscription !== 'string' || !d.inscription.trim()) return 'Inscription is empty';
  if (d.inscription.length > MAX_TEXT_LENGTH) return 'Inscription is too long';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.eventDate || '')) return 'Event date is missing';
  var today = Utilities.formatDate(new Date(), 'Europe/Minsk', 'yyyy-MM-dd');
  if (d.eventDate < today) return 'Event date is in the past';
  if (!isFinite(d.usdNo) || !isFinite(d.usdYes)) return 'Prices are missing';
  return null;
}

/** Allows MAX_PER_HOUR requests per hour in total. */
function takeRateLimit() {
  var cache = CacheService.getScriptCache();
  var key = 'rate-' + Utilities.formatDate(new Date(), 'UTC', 'yyyyMMddHH');
  var count = Number(cache.get(key) || 0);
  if (count >= MAX_PER_HOUR) return false;
  cache.put(key, String(count + 1), 3600);
  return true;
}

function formatMessage(d) {
  var lines = [
    '🔥 <b>Заявка на шоу</b>',
    '📅 Дата мероприятия: <b>' + formatDate(d.eventDate) + '</b>',
    '✍️ Надпись: <b>' + esc(d.inscription) + '</b>' + (d.counts ? ' (' + esc(d.counts) + ')' : ''),
    '💰 Без пиротехники: <b>' + num(d.usdNo) + ' USD</b>' + (isFinite(d.bynNo) ? ' / ' + num(d.bynNo) + ' BYN' : ''),
    '💥 С пиротехникой: <b>' + num(d.usdYes) + ' USD</b>' + (isFinite(d.bynYes) ? ' / ' + num(d.bynYes) + ' BYN' : ''),
    '⚙️ Robinson club: ' + (d.robinson ? 'да' : 'нет') + ' · Double fountains: ' + (d.fountains ? 'да' : 'нет'),
  ];
  if (d.rate) lines.push('💱 Курс НБРБ' + (d.rateDate ? ' на ' + esc(d.rateDate) : '') + ': ' + esc(String(d.rate)));
  if (d.weather) lines.push('🌦 Погода: ' + esc(d.weather));
  return lines.join('\n');
}

/** Sends the message to every chat id; returns how many chats got it. */
function sendToAll(text) {
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty('BOT_TOKEN');
  var ids = (props.getProperty('CHAT_IDS') || '').split(',').map(function (s) { return s.trim(); }).filter(String);
  var sent = 0;
  ids.forEach(function (id) {
    var res = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ chat_id: id, text: text, parse_mode: 'HTML' }),
      muteHttpExceptions: true,
    });
    if (res.getResponseCode() === 200) sent++;
  });
  return sent;
}

/**
 * Run this once from the editor (Run -> showChatIds) AFTER you and the second person pressed Start
 * in the bot. It writes the chat ids to the log (View -> Logs); copy them into CHAT_IDS.
 */
function showChatIds() {
  var token = PropertiesService.getScriptProperties().getProperty('BOT_TOKEN');
  var res = JSON.parse(UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/getUpdates').getContentText());
  var seen = {};
  (res.result || []).forEach(function (u) {
    var chat = (u.message || {}).chat;
    if (chat && !seen[chat.id]) {
      seen[chat.id] = true;
      Logger.log('chat_id: ' + chat.id + '  —  ' + [chat.first_name, chat.last_name, chat.username ? '@' + chat.username : ''].join(' '));
    }
  });
  if (!Object.keys(seen).length) Logger.log('No chats yet: open the bot in Telegram, press Start, then run this again.');
}

/** Sends a test message to everyone in CHAT_IDS (Run -> sendTestMessage). */
function sendTestMessage() {
  Logger.log('Sent to ' + sendToAll('✅ Бот калькулятора подключён. Заявки будут приходить сюда.') + ' chat(s)');
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function num(n) {
  return String(Math.round(Number(n)));
}

function formatDate(iso) {
  var p = iso.split('-');
  return p[2] + '.' + p[1] + '.' + p[0];
}
