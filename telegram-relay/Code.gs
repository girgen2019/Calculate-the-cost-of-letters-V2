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

var RELAY_VERSION = 7;       // shown when the web app URL is opened: tells which code is deployed
var MAX_PER_HOUR = 40;      // all requests together (a send with a track = 2 requests): protects your Telegram from spam
var MAX_TEXT_LENGTH = 120;  // inscription length limit
var MAX_MUSIC_LENGTH = 200; // music: track name or link
var MAX_AUDIO_MB = 20;      // attached MP3 (the page has the same limits)
var MAX_IMAGE_MB = 10;      // attached picture

/** The calculator sends a POST with a JSON body (as text/plain, so the browser makes no CORS preflight). */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // Honeypot: the page never fills this field, simple bots do
    if (data.website) return reply({ ok: true });

    var error = validate(data);
    if (error) return reply({ ok: false, error: error });

    if (!takeRateLimit()) return reply({ ok: false, error: 'Too many requests, try again later' });

    // Second request from the page: the attached track or picture, uploaded in the background.
    // It is sent with the whole request as its caption and the text message sent before is deleted,
    // so the chat ends up with ONE message: the track + the request. If the file fails, the text stays.
    if (data.kind === 'file') {
      if (!data.file) return reply({ ok: false, error: 'No file' });
      var cache = CacheService.getScriptCache();
      var key = 'msg-' + String(data.replaceToken || '');
      // A phone may resend the file after its connection broke: deliver it only once per request
      if (data.replaceToken && cache.get('done-' + data.replaceToken)) return reply({ ok: true, repeated: true });
      var textMessages = JSON.parse(cache.get(key) || '{}');
      var caption = formatMessage(data);
      // Telegram allows 1024 characters in a caption; a very long request keeps a short caption
      if (caption.length > 1000) caption = '🔥 <b>' + esc(data.inscription) + '</b> · ' + formatDate(data.eventDate);
      var fileError = sendFileToAll(data.file, caption, data.music, textMessages);
      if (!fileError) {
        cache.remove(key);
        if (data.replaceToken) cache.put('done-' + data.replaceToken, '1', 3600);
      }
      return reply({ ok: !fileError, error: fileError || undefined });
    }

    var result = sendToAll(formatMessage(data));
    if (!result.sent) return reply({ ok: false, sent: 0, error: result.error });
    // The page gets a one-time token instead of message ids, so it can only replace its own message
    var replaceToken = Utilities.getUuid();
    CacheService.getScriptCache().put('msg-' + replaceToken, JSON.stringify(result.messages), 3600);
    return reply({ ok: true, sent: result.sent, replaceToken: replaceToken });
  } catch (err) {
    return reply({ ok: false, error: 'Bad request' });
  }
}

/** Opening the web app URL in a browser just says it works (no secrets are shown). */
function doGet() {
  return reply({ ok: true, service: 'letters-calculator-telegram-relay', version: RELAY_VERSION });
}

function validate(d) {
  if (typeof d.inscription !== 'string' || !d.inscription.trim()) return 'Inscription is empty';
  if (d.inscription.length > MAX_TEXT_LENGTH) return 'Inscription is too long';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.eventDate || '')) return 'Event date is missing';
  var today = Utilities.formatDate(new Date(), 'Europe/Minsk', 'yyyy-MM-dd');
  if (d.eventDate < today) return 'Event date is in the past';
  if (!isFinite(d.usdNo) || !isFinite(d.usdYes)) return 'Prices are missing';
  if (d.music && String(d.music).length > MAX_MUSIC_LENGTH) return 'Music text is too long';
  if (d.file) {
    var f = d.file;
    var isImage = String(f.type).indexOf('image/') === 0;
    if (!isImage && String(f.type).indexOf('audio/') !== 0) return 'Only audio or a picture can be attached';
    if (typeof f.data !== 'string' || !f.data) return 'Attached file is empty';
    // base64 is 4/3 of the file size
    if (f.data.length * 3 / 4 > (isImage ? MAX_IMAGE_MB : MAX_AUDIO_MB) * 1024 * 1024) return 'Attached file is too big';
  }
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
    '🎵 Музыка: ' + (d.music ? esc(d.music) : 'не указана'),
    '⚙️ Robinson club: ' + (d.robinson ? 'да' : 'нет') + ' · Double fountains: ' + (d.fountains ? 'да' : 'нет'),
  ];
  if (d.rate) lines.push('💱 Курс НБРБ' + (d.rateDate ? ' на ' + esc(d.rateDate) : '') + ': ' + esc(String(d.rate)));
  if (d.weather) lines.push('🌦 Погода: ' + esc(d.weather));
  return lines.join('\n');
}

function settings() {
  var props = PropertiesService.getScriptProperties();
  return {
    token: props.getProperty('BOT_TOKEN'),
    ids: (props.getProperty('CHAT_IDS') || '').split(',').map(function (s) { return s.trim(); }).filter(String),
  };
}

function telegramError(res) {
  try {
    return 'Telegram: ' + (JSON.parse(res.getContentText()).description || res.getResponseCode());
  } catch (e) {
    return 'Telegram: ' + res.getResponseCode();
  }
}

/** Sends the message to every chat id; returns how many chats got it and, if none, why (Telegram's own words). */
function sendToAll(text) {
  var s = settings();
  var token = s.token;
  var ids = s.ids;
  if (!token) return { sent: 0, error: 'BOT_TOKEN is not set in Script Properties' };
  if (!ids.length) return { sent: 0, error: 'CHAT_IDS is not set in Script Properties' };
  var sent = 0;
  var error = '';
  var messages = {}; // chat id -> message id, to replace the text with the track later
  ids.forEach(function (id) {
    var res = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ chat_id: id, text: text, parse_mode: 'HTML' }),
      muteHttpExceptions: true,
    });
    if (res.getResponseCode() === 200) {
      sent++;
      messages[id] = JSON.parse(res.getContentText()).result.message_id;
    } else error = telegramError(res);
  });
  return { sent: sent, error: error, messages: messages };
}

/**
 * Sends the attached file to every chat: an MP3 as a playable track (sendAudio), a picture as a photo
 * (sendPhoto); if Telegram refuses that format, as a plain file (sendDocument). The file is uploaded once,
 * other chats get it by Telegram's file_id. When it arrives in a chat, the earlier text message of this
 * request (textMessages: chat id -> message id) is deleted. Returns '' or the reason it was not delivered.
 */
function sendFileToAll(file, caption, music, textMessages) {
  textMessages = textMessages || {};
  // "Shaman - Ты Моя" -> performer "Shaman", title "Ты Моя": Telegram shows them on the track
  var parts = String(music || '').split(/\s+[-–—]\s+/);
  var s = settings();
  var isImage = String(file.type).indexOf('image/') === 0;
  var blob = Utilities.newBlob(Utilities.base64Decode(file.data), file.type, String(file.name || 'file').slice(0, 100));
  var api = 'https://api.telegram.org/bot' + s.token + '/';
  var method = isImage ? 'sendPhoto' : 'sendAudio';
  var field = isImage ? 'photo' : 'audio';
  var fileId = '';
  var error = '';
  s.ids.forEach(function (id) {
    // The text already notified the person, so the replacement comes silently
    var extra = { caption: caption, parse_mode: 'HTML', disable_notification: String(Boolean(textMessages[id])) };
    var payload = Object.assign({ chat_id: id }, extra);
    payload[field] = fileId || blob;
    if (field === 'audio' && parts.length > 1) {
      payload.performer = parts[0];
      payload.title = parts.slice(1).join(' - ');
    } else if (field === 'audio' && music) {
      payload.title = music;
    }
    var res = UrlFetchApp.fetch(api + method, { method: 'post', payload: payload, muteHttpExceptions: true });
    if (res.getResponseCode() !== 200 && !fileId) {
      // e.g. WAV/OGG for sendAudio or a huge picture for sendPhoto: send it as a document instead
      method = 'sendDocument';
      field = 'document';
      payload = Object.assign({ chat_id: id, document: blob }, extra);
      res = UrlFetchApp.fetch(api + method, { method: 'post', payload: payload, muteHttpExceptions: true });
    }
    if (res.getResponseCode() !== 200) {
      error = telegramError(res);
      return;
    }
    var msg = JSON.parse(res.getContentText()).result || {};
    var sentFile = msg.audio || msg.document || (msg.photo && msg.photo[msg.photo.length - 1]);
    if (sentFile && !fileId) fileId = sentFile.file_id;
    if (textMessages[id]) {
      UrlFetchApp.fetch(api + 'deleteMessage', {
        method: 'post',
        payload: { chat_id: id, message_id: String(textMessages[id]) },
        muteHttpExceptions: true,
      });
    }
  });
  return error;
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
  var result = sendToAll('✅ Бот калькулятора подключён. Заявки будут приходить сюда.');
  Logger.log('Sent to ' + result.sent + ' chat(s)' + (result.error ? ' — ' + result.error : ''));
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
