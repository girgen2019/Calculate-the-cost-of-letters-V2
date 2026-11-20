/** @format */
import {
  TELEGRAM_RELAY_URL,
  SEND_COOLDOWN_MS,
  MAX_AUDIO_MB,
  MAX_IMAGE_MB,
  ATTACH_ACCEPT,
  AUDIO_TYPES,
  STOCK_LETTERS,
  ROBINSON_CLUB,
  WEATHER_CODES,
  FORECAST_DAYS,
  NBRB_USD_RATE_URL,
  PRICE,
  HEART_CHAR_CODE,
  LAYOUT,
  TIMING,
  UPLOAD_ATTEMPTS,
  MAX_MUSIC_LENGTH,
} from './config.js?v=20261119b';
import { basePrices, fountainsPrice, robinsonPrice } from './domain/pricing.js?v=20261119d';
import { HEART, isHeart, parseInscription } from './domain/inscription.js?v=20261120b';

// The main input, declared explicitly instead of the browser's automatic global for id="input"
const input = document.getElementById('input');
let USD_RATES;
let lastQuote = null; // what the price cards show now, for the "Send" dialog
let rateDate = ''; // date of the NBRB rate, e.g. "30.10.2026"
let defaultPlace = document.getElementById('robinson');
let defaultPlaceFocus = document.querySelector('.container__controls');
let doublePyro = document.getElementById('double');
let heartClick = document.getElementById('heart');

// ================ MODE SWITCH: Price | Letters
const modeSwitch = document.querySelector('.mode-switch');
const modeButtons = modeSwitch.querySelectorAll('.mode-switch__btn');

function setMode(mode) {
  modeSwitch.dataset.active = mode; // moves the red thumb (CSS)
  modeButtons.forEach((btn) => btn.setAttribute('aria-pressed', String(btn.dataset.mode === mode)));
}

modeButtons.forEach((btn) =>
  btn.addEventListener('click', () => {
    setMode(btn.dataset.mode);
    if (btn.dataset.mode === 'letters') openLettersCheck();
  })
);

// ================ CHECKING LETTERS

// Takes letters from the stock one by one; extra copies of a letter end up in "missing"
function findLetters(word) {
  const left = [...STOCK_LETTERS];
  const found = [];
  const missing = [];
  word
    .toLowerCase()
    .split('')
    .filter((ch) => ch.trim())
    .forEach((ch) => {
      const i = left.indexOf(ch);
      if (i >= 0) {
        found.push(ch);
        left.splice(i, 1);
      } else {
        missing.push(ch);
      }
    });
  return { found, missing };
}

function lettersEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function openLettersCheck() {
  if (document.querySelector('.letters-overlay')) return;

  const overlay = lettersEl('div', 'letters-overlay');
  const modal = lettersEl('div', 'letters-modal');
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'lettersTitle');

  const header = lettersEl('div', 'letters-header');
  const title = lettersEl('h2', 'letters-title', 'Checking letters');
  title.id = 'lettersTitle';
  const closeBtn = lettersEl('button', 'letters-close', '✕');
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Close');
  header.append(title, closeBtn);

  const field = lettersEl('input', 'letters-input');
  field.type = 'text';
  field.placeholder = 'Type a word…';
  field.setAttribute('aria-label', 'Word to check');

  const summary = lettersEl('p', 'letters-summary');
  const foundGroup = lettersEl('div', 'letters-group');
  const missingGroup = lettersEl('div', 'letters-group letters-group--missing');

  function renderGroup(group, label, letters, keyClass) {
    const head = lettersEl('div', 'letters-group__head');
    head.append(lettersEl('span', 'letters-group__label', label), lettersEl('span', 'letters-badge', String(letters.length)));
    const list = lettersEl('div', 'letters-list');
    letters.forEach((ch) => list.appendChild(lettersEl('span', 'letters-key ' + keyClass, ch)));
    if (!letters.length) list.appendChild(lettersEl('span', 'letters-empty', '—'));
    group.replaceChildren(head, list);
  }

  function render() {
    const { found, missing } = findLetters(field.value);
    const total = found.length + missing.length;
    if (!total) {
      summary.textContent = 'Type a word to see which letters are in stock';
      summary.className = 'letters-summary';
      foundGroup.hidden = true;
      missingGroup.hidden = true;
      return;
    }
    summary.textContent = missing.length
      ? `${found.length} of ${total} letters in stock`
      : `All ${total} letters are in stock`;
    summary.className = 'letters-summary ' + (missing.length ? 'is-missing' : 'is-ok');
    foundGroup.hidden = false;
    missingGroup.hidden = false;
    renderGroup(foundGroup, 'In stock', found, 'letters-key--found');
    renderGroup(missingGroup, 'Missing', missing, 'letters-key--missing');
  }

  // Closing plays the same fade/scale animation backwards, then removes the dialog
  function close() {
    if (overlay.classList.contains('is-closing')) return;
    overlay.classList.add('is-closing');
    const done = () => {
      overlay.remove();
      document.removeEventListener('keydown', onKey);
      setMode('price');
      input.focus();
    };
    overlay.addEventListener('animationend', (e) => e.target === overlay && done());
    setTimeout(() => overlay.isConnected && done(), TIMING.DIALOG_CLOSE_FALLBACK_MS); // fallback if animations are off
  }
  function onKey(e) {
    if (e.key === 'Escape') close();
  }

  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => e.target === overlay && close());
  document.addEventListener('keydown', onKey);
  field.addEventListener('input', render);

  modal.append(header, field, summary, foundGroup, missingGroup);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  render();
  setTimeout(() => field.focus(), TIMING.FOCUS_DELAY_MS);
}

doublePyro.addEventListener('change', () => {
  if (!doublePyro.hasAttribute('checked')) {
    doublePyro.setAttribute('checked', true);
    addDoubleFountain();
    onInput();
  } else if (doublePyro.hasAttribute('checked')) {
    doublePyro.removeAttribute('checked');
    addDoubleFountain();
    onInput();
  }
});
defaultPlace.addEventListener('click', () => {
  if (!defaultPlace.hasAttribute('checked')) {
    defaultPlace.setAttribute('checked', true);
    addFiveBaks();
    onInput();
  } else if (defaultPlace.hasAttribute('checked')) {
    defaultPlace.removeAttribute('checked');
    addFiveBaks();
    onInput();
  }
});

// Shows the two prices as cards, the price breakdown, the whole inscription and its letter tiles
function getResult(chars, usdNo, usdYes, bynNo, bynYes, counts) {
  const venue = addFiveBaks();
  // BYN keeps the original rounding: rounded-up base + rounded venue surcharge; unknown without a rate
  const byn = (base) => (USD_RATES ? base + Math.round(venue * USD_RATES) : null);
  // Snapshot for the "Send" dialog: exactly what the cards show
  lastQuote = chars.length
    ? {
        usdNo: usdNo + venue,
        usdYes: usdYes + venue,
        bynNo: byn(bynNo),
        bynYes: byn(bynYes),
        counts:
          (counts.letters ? ruPlural(counts.letters, 'буква', 'буквы', 'букв') : '') +
          (counts.letters && counts.hearts ? ' + ' : '') +
          (counts.hearts ? ruPlural(counts.hearts, 'сердце', 'сердца', 'сердец') : ''),
      }
    : null;
  renderResult(
    chars,
    [
      { label: 'Without pyrotechnics', usd: usdNo + venue, byn: byn(bynNo) },
      { label: 'With pyrotechnics', usd: usdYes + venue, byn: byn(bynYes), accent: true },
    ],
    breakdownRows(counts, venue, usdNo + venue, usdYes + venue)
  );
}

// What the viewer sees: price-list items, options and the totals.
// The internal steps of the formula in prepareResult (the 30 USD threshold and rounding up)
// stay under the hood and are not shown as separate lines.
function breakdownRows({ letters, hearts }, venue, totalNo, totalYes) {
  const fountains = addDoubleFountain();
  const pyro = (letters + hearts) * PRICE.PYRO_PER_UNIT;
  // One line for the inscription with the discount (and rounding) already applied:
  // it is whatever the formula gives without the options, so the lines always add up to the totals
  const inscription = totalNo - venue - fountains;
  const label =
    [letters ? `Letters ${letters}` : '', hearts ? `Hearts ${hearts}` : ''].filter(Boolean).join(' + ') +
    ' (discount applied)';
  const rows = [[label, inscription]];
  if (fountains) rows.push(['Double fountains', fountains]);
  if (venue) rows.push(['Robinson club', venue]);
  rows.push(['Without pyrotechnics', totalNo, 'total']);
  rows.push([`Pyrotechnics ${letters + hearts} × ${PRICE.PYRO_PER_UNIT}`, pyro]);
  rows.push(['With pyrotechnics', totalYes, 'total accent']);
  return rows;
}

const formatUsd = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
// Breakdown open/closed: open on tall screens by default, then the viewer's choice is kept
let breakdownOpen = null;

function renderResult(chars, prices, rows) {
  const output = document.getElementById('output');
  if (!chars.length) {
    output.replaceChildren(lettersEl('p', 'result__empty', 'Type an inscription to see the price'));
    fitResult();
    return;
  }

  const cards = lettersEl('div', 'result__prices');
  prices.forEach((p) => {
    const card = lettersEl('div', 'price-card' + (p.accent ? ' price-card--accent' : ''));
    const usd = lettersEl('div', 'price-card__usd');
    usd.append(lettersEl('b', '', String(p.usd)), lettersEl('span', '', ' USD'));
    card.append(
      lettersEl('div', 'price-card__label', p.label),
      usd,
      lettersEl('div', 'price-card__byn', p.byn === null ? 'BYN n/a' : p.byn + ' BYN')
    );
    cards.appendChild(card);
  });

  const details = lettersEl('details', 'breakdown');
  if (breakdownOpen === null) breakdownOpen = window.innerHeight >= LAYOUT.BREAKDOWN_OPEN_MIN_HEIGHT;
  details.open = breakdownOpen;
  details.addEventListener('toggle', () => {
    breakdownOpen = details.open;
    fitResult();
  });
  details.appendChild(lettersEl('summary', 'breakdown__summary', 'Price breakdown'));
  const table = lettersEl('div', 'breakdown__rows');
  rows.forEach(([label, usd, kind]) => {
    const row = lettersEl('div', 'breakdown__row' + (kind ? ' ' + kind.split(' ').map((k) => 'breakdown__row--' + k).join(' ') : ''));
    row.append(lettersEl('span', '', label), lettersEl('span', 'breakdown__usd', (kind ? '' : '+ ') + formatUsd(usd) + ' USD'));
    table.appendChild(row);
  });
  details.appendChild(table);

  const letters = chars.filter((ch) => !isHeart(ch)).length;
  const hearts = chars.length - letters;
  const head = lettersEl('div', 'letters-group__head');
  head.append(
    lettersEl('span', 'letters-group__label', 'Inscription'),
    lettersEl('span', 'letters-badge', chars.length + (chars.length > 1 ? ' units' : ' unit')),
    lettersEl(
      'span',
      'result__counts',
      letters + (letters === 1 ? ' letter' : ' letters') + (hearts ? ' + ' + hearts + (hearts === 1 ? ' heart' : ' hearts') : '')
    )
  );
  const word = lettersEl('div', 'result__word', document.getElementById('input').value.trim());
  const list = lettersEl('div', 'letters-list result__letters');
  chars.forEach((ch) =>
    list.appendChild(
      lettersEl('span', 'letters-key ' + (isHeart(ch) ? 'letters-key--heart' : 'letters-key--found'), ch)
    )
  );
  const inscription = lettersEl('div', 'result__inscription');
  inscription.append(head, word, list);

  output.replaceChildren(cards, details, inscription);
  fitResult();
}

// The result block takes the free height down to the bottom of the window;
// only the letter tiles scroll, so the prices always stay visible
function fitResult() {
  const output = document.getElementById('output');
  const free = window.innerHeight - output.getBoundingClientRect().top - LAYOUT.RESULT_BOTTOM_GAP;
  // Too little room (phone in landscape): no limit, the page scrolls instead (see CSS max-height: 520px)
  output.style.maxHeight = free >= LAYOUT.RESULT_MIN_HEIGHT ? free + 'px' : '';
}
window.addEventListener('resize', fitResult);

function prepareResult(array) {
  let sumHearts = array.filter((hearts) => {
    return hearts.trim().charCodeAt() === HEART_CHAR_CODE;
  }).length;

  let sumLetters = array.filter(
    (letters) => !letters.includes(HEART)
  ).length;

  // The formula lives in domain/pricing.js
  const { usdNo: resultNoPyrotechnics, usdYes: resultWithPyrotechnics } = basePrices(
    sumLetters,
    sumHearts,
    doublePyro.checked
  );

  let resultNoPyrotechnicsBYN = Math.ceil(USD_RATES * resultNoPyrotechnics);
  let resultWithPyrotechnicsBYN = Math.ceil(USD_RATES * resultWithPyrotechnics);

  getResult(
    array,
    resultNoPyrotechnics,
    resultWithPyrotechnics,
    resultNoPyrotechnicsBYN,
    resultWithPyrotechnicsBYN,
    { letters: sumLetters, hearts: sumHearts }
  );
}

function addDoubleFountain() {
  return fountainsPrice(doublePyro.checked);
}

function addFiveBaks() {
  input.focus();
  return robinsonPrice(defaultPlace.checked);
}

// The text is split into characters in domain/inscription.js
function checkString(str) {
  prepareResult(parseInscription(str).chars);
}

function addHeart() {
  input.value += HEART;
  input.focus();
  onInput();
}

function onInput() {
  // By id, not "the first input on the page": the header has a date input before it
  const text = document.getElementById('input').value;
  document.getElementById('inputClear').hidden = !text;
  // ➤ only when the Telegram relay is configured and there is something to send
  document.getElementById('inputSend').hidden = !TELEGRAM_RELAY_URL || !text.trim();
  checkString(text.trim());
}

// ================ SEND TO TELEGRAM (settings are at the top of the file)
// "1 буква", "3 буквы", "12 букв" — Russian plural forms for the Telegram message
function ruPlural(n, one, few, many) {
  const tens = n % 100;
  const units = n % 10;
  const word = tens >= 11 && tens <= 14 ? many : units === 1 ? one : units >= 2 && units <= 4 ? few : many;
  return n + ' ' + word;
}

const isoDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function weatherFor(date) {
  const i = forecast ? forecast.time.indexOf(date) : -1;
  if (i < 0) return '';
  const [icon, text] = WEATHER_CODES[forecast.weather_code[i]] || ['🌡️', ''];
  return `${icon} ${text}, ${Math.round(forecast.temperature_2m_min[i])}…${Math.round(
    forecast.temperature_2m_max[i]
  )}°C, wind ${Math.round(forecast.wind_speed_10m_max[i])} km/h`;
}

// text/plain: a "simple" request, so the browser sends no CORS preflight that Apps Script can't answer
async function postToRelay(body) {
  const res = await fetch(TELEGRAM_RELAY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
  });
  return res.json();
}

// Some phones give a file without a type (file.type === ''): take it from the extension
function fileType(file) {
  if (file.type) return file.type;
  return AUDIO_TYPES[(file.name.split('.').pop() || '').toLowerCase()] || '';
}

const readAsBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(new Error('could not read the file'));
    reader.readAsDataURL(file);
  });

// Small pill at the bottom of the page: "🎵 Uploading track…" -> "✅ Track sent" / "❌ …"
function showUploadToast(text, state) {
  let toast = document.querySelector('.send-toast');
  if (!toast) {
    toast = lettersEl('div', 'send-toast');
    toast.setAttribute('role', 'status');
    document.body.appendChild(toast);
  }
  clearTimeout(toast.hideTimer);
  toast.textContent = text;
  toast.className = 'send-toast' + (state ? ' is-' + state : '');
  if (state) toast.hideTimer = setTimeout(() => toast.remove(), state === 'ok' ? TIMING.TOAST_OK_MS : TIMING.TOAST_ERROR_MS);
}

// Uploads the attached file after the request; the page warns before closing while it is in progress
// Uploads the attached file after the request. On phones the browser pauses a page that goes to the
// background (e.g. you switch to Telegram to look), and the upload breaks; it is retried automatically
// when the page is back. The relay ignores a repeat of an already delivered file (same replaceToken).
async function uploadInBackground(request, file) {
  const what = file.type.startsWith('image/') ? 'Picture' : 'Track';
  const warn = (e) => {
    e.preventDefault();
    e.returnValue = '';
  };
  let wentHidden = document.hidden;
  const onVisibility = () => {
    if (document.hidden) wentHidden = true;
  };
  window.addEventListener('beforeunload', warn);
  document.addEventListener('visibilitychange', onVisibility);
  const stop = () => {
    window.removeEventListener('beforeunload', warn);
    document.removeEventListener('visibilitychange', onVisibility);
  };
  for (let attempt = 1; attempt <= UPLOAD_ATTEMPTS; attempt++) {
    showUploadToast(
      attempt === 1 ? `🎵 Uploading ${what.toLowerCase()}… keep this page open` : `🎵 Resuming ${what.toLowerCase()} upload…`
    );
    try {
      const result = await postToRelay({ ...request, file });
      if (!result.ok) {
        stop();
        showUploadToast(`❌ ${what} not sent: ` + (result.error || 'not accepted'), 'error');
        return;
      }
      stop();
      showUploadToast(`✅ ${what} added to the request in Telegram`, 'ok');
      return;
    } catch (err) {
      // Network broke: if the page was in the background, wait until it is visible again and retry
      if (attempt < UPLOAD_ATTEMPTS && (wentHidden || document.hidden)) {
        showUploadToast(`⏸ ${what} upload paused — it continues when this page is open`);
        if (document.hidden) {
          await new Promise((resolve) => {
            const back = () => {
              if (document.hidden) return;
              document.removeEventListener('visibilitychange', back);
              resolve();
            };
            document.addEventListener('visibilitychange', back);
          });
        }
        wentHidden = false;
        continue;
      }
      stop();
      showUploadToast(`❌ ${what} not sent: ` + (err.message === 'Failed to fetch' || err.message === 'Load failed' ? 'no connection' : err.message), 'error');
      return;
    }
  }
}

// File name -> track name: no extension, no download ids / hashes, no underscores
function trackName(fileName) {
  return fileName
    .replace(/\.[a-z0-9]{2,4}$/i, '')
    .replace(/[_\s-]*[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i, '')
    .replace(/[_\s-]*[0-9a-f]{16,}$/i, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function openSendDialog() {
  const inscription = document.getElementById('input').value.trim();
  if (!inscription || !lastQuote || document.querySelector('.letters-overlay')) return;
  let quote = { ...lastQuote };

  const overlay = lettersEl('div', 'letters-overlay');
  const modal = lettersEl('div', 'letters-modal send-modal');
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'sendTitle');

  const header = lettersEl('div', 'letters-header');
  const title = lettersEl('h2', 'letters-title', 'Send to Telegram');
  title.id = 'sendTitle';
  const closeBtn = lettersEl('button', 'letters-close', '✕');
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Close');
  header.append(title, closeBtn);

  // Options chosen in the calculator, then ONE total: with or without pyrotechnics, as the switch says.
  // Telegram gets the same: "Пиротехника: да/нет" and that total only.
  const summary = lettersEl('div', 'send-summary');
  const options = lettersEl('div', 'send-prices', `Robinson club: ${defaultPlace.checked ? 'yes' : 'no'}`);
  // A toggle in the calculator style: <label> with a hidden checkbox, the pill track and the text
  function toggle(text, checked) {
    const label = lettersEl('label', 'toggle');
    const box = lettersEl('input', 'toggle__input');
    box.type = 'checkbox';
    box.checked = checked;
    box.setAttribute('role', 'switch');
    label.append(box, lettersEl('span', 'toggle__track'), lettersEl('span', 'toggle__text', text));
    return { label, box };
  }
  // Double fountains starts as in the calculator; switching it here switches it there too,
  // so the calculator recounts the prices and the total below stays exact
  const fountains = toggle('Double fountains', doublePyro.checked);
  fountains.box.addEventListener('change', () => {
    if (doublePyro.checked !== fountains.box.checked) doublePyro.click();
    quote = { ...lastQuote };
    showTotal();
    fountains.box.focus(); // the calculator moves the focus to its input; keep it in the dialog
  });
  const pyroToggle = toggle('With pyrotechnics', false);
  const pyroInput = pyroToggle.box;
  const toggles = lettersEl('div', 'send-toggles');
  toggles.append(fountains.label, pyroToggle.label);
  const total = lettersEl('div', 'send-total');
  function showTotal() {
    const pyro = pyroInput.checked;
    const usd = pyro ? quote.usdYes : quote.usdNo;
    const byn = pyro ? quote.bynYes : quote.bynNo;
    total.classList.toggle('send-total--pyro', pyro);
    total.replaceChildren(
      lettersEl('span', 'send-total__label', pyro ? 'Total with pyrotechnics' : 'Total without pyrotechnics'),
      lettersEl('b', 'send-total__usd', `${usd} USD`),
      lettersEl('span', 'send-total__byn', byn === null ? '' : `${byn} BYN`)
    );
  }
  pyroInput.addEventListener('change', showTotal);
  showTotal();
  summary.append(lettersEl('div', 'result__word', inscription), options, toggles, total);

  // Date: typed by hand as DD.MM.YYYY (the native field follows the browser locale, e.g. mm/dd/yyyy);
  // the real date input lies invisibly over the calendar icon and opens the picker
  const dateLabel = lettersEl('label', 'send-label', 'Event date');
  const dateField = lettersEl('span', 'letters-input send-field');
  const dateText = lettersEl('input', 'send-date-text');
  dateText.type = 'text';
  dateText.inputMode = 'numeric';
  dateText.maxLength = 10;
  dateText.placeholder = 'dd.mm.yyyy';
  dateText.autocomplete = 'off';
  const dateIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  dateIcon.setAttribute('viewBox', '0 0 24 24');
  dateIcon.setAttribute('aria-hidden', 'true');
  dateIcon.innerHTML = '<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>';
  const dateInput = lettersEl('input', 'send-date');
  dateInput.type = 'date';
  dateInput.required = true;
  dateInput.min = isoDate(new Date());
  // Use the header weather date only if someone picked a future day there; the header shows today by
  // default, and pre-filling today would make it easy to send the wrong date. Otherwise the field stays empty.
  const headerDate = document.getElementById('weatherDate').value;
  if (headerDate && headerDate > dateInput.min) dateInput.value = headerDate;
  const showDateText = () => {
    const [y, m, d] = dateInput.value.split('-');
    dateText.value = dateInput.value ? `${d}.${m}.${y}` : '';
  };
  showDateText();
  let dateError = '';
  dateField.append(dateText, dateIcon, dateInput);
  dateLabel.appendChild(dateField);

  const musicLabel = lettersEl('label', 'send-label', 'Music');
  const musicInput = lettersEl('input', 'letters-input send-field send-music');
  musicInput.type = 'text';
  musicInput.maxLength = MAX_MUSIC_LENGTH;
  musicInput.placeholder = 'Track name or link (optional)';
  musicLabel.appendChild(musicInput);

  // Attachment: an MP3 (or other audio) or a picture, dropped here or chosen from the device.
  // It is previewed (audio can be played) and sent to Telegram as a playable track / photo.
  let attachment = null;
  let attachmentUrl = '';
  const drop = lettersEl('div', 'send-drop');
  const fileInput = lettersEl('input', 'send-file');
  fileInput.type = 'file';
  fileInput.accept = ATTACH_ACCEPT;
  const dropHint = lettersEl('span', 'send-drop-hint', '🎵 Drop an MP3 or a picture here, or click to choose');
  const preview = lettersEl('div', 'send-preview');
  drop.append(fileInput, dropHint, preview);
  const fileError = lettersEl('p', 'letters-summary send-file-error');

  function setAttachment(file) {
    fileError.textContent = '';
    if (attachmentUrl) URL.revokeObjectURL(attachmentUrl);
    attachment = null;
    attachmentUrl = '';
    preview.replaceChildren();
    drop.classList.remove('has-file');
    if (!file) return;
    const type = fileType(file);
    const kind = type.startsWith('audio/') ? 'audio' : type.startsWith('image/') ? 'image' : '';
    const limit = kind === 'image' ? MAX_IMAGE_MB : MAX_AUDIO_MB;
    if (!kind) {
      fileError.textContent = 'Only audio (MP3) or a picture';
      return;
    }
    if (file.size > limit * 1024 * 1024) {
      fileError.textContent = `File is too big: max ${limit} MB`;
      return;
    }
    attachment = file;
    attachmentUrl = URL.createObjectURL(file);
    const media = lettersEl(kind === 'audio' ? 'audio' : 'img', 'send-preview__media');
    media.src = attachmentUrl;
    if (kind === 'audio') media.controls = true;
    else media.alt = file.name;
    const info = lettersEl('span', 'send-preview__name', `${file.name} · ${file.size < 1024 * 1024 ? Math.ceil(file.size / 1024) + ' KB' : (file.size / 1024 / 1024).toFixed(1) + ' MB'}`);
    const remove = lettersEl('button', 'send-preview__remove', '✕');
    remove.type = 'button';
    remove.setAttribute('aria-label', 'Remove file');
    remove.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.value = '';
      setAttachment(null);
    });
    preview.append(media, info, remove);
    drop.classList.add('has-file');
    // "Shaman - Ты Моя_ef6b968a-243f-….mp3" -> "Shaman - Ты Моя" in the Music field, if it is empty
    if (kind === 'audio' && !musicInput.value.trim()) musicInput.value = trackName(file.name);
  }

  const weatherLine = lettersEl('p', 'letters-summary send-weather');
  // Invisible to people; simple bots fill every field, the relay ignores such requests
  const honeypot = lettersEl('input', 'send-honeypot');
  honeypot.tabIndex = -1;
  honeypot.autocomplete = 'off';
  honeypot.setAttribute('aria-hidden', 'true');

  const status = lettersEl('p', 'send-status');
  status.setAttribute('role', 'status');
  const actions = lettersEl('div', 'send-actions');
  const cancelBtn = lettersEl('button', 'send-btn send-btn--ghost', 'Cancel');
  cancelBtn.type = 'button';
  const sendBtn = lettersEl('button', 'send-btn', 'Send ➤');
  sendBtn.type = 'button';
  actions.append(cancelBtn, sendBtn);

  // Send stays clickable: pressing it without a valid date shows the reason in red under the field
  let triedToSend = false;
  function dateProblem() {
    if (dateError) return dateError;
    if (dateInput.value && dateInput.value < dateInput.min) return 'This date has already passed';
    if (!dateInput.value && triedToSend) return 'Choose the event date';
    return '';
  }
  function refresh() {
    const problem = dateProblem();
    const weather = dateInput.value && !problem ? weatherFor(dateInput.value) : '';
    weatherLine.textContent =
      problem || weather || (dateInput.value ? 'No forecast for this date yet' : 'Pick the event date');
    weatherLine.classList.toggle('is-error', Boolean(problem));
    dateField.classList.toggle('is-invalid', Boolean(problem));
    sendBtn.disabled = overlay.dataset.busy === '1';
  }

  function close() {
    if (overlay.classList.contains('is-closing')) return;
    overlay.classList.add('is-closing');
    const done = () => {
      overlay.remove();
      if (attachmentUrl) URL.revokeObjectURL(attachmentUrl);
      document.removeEventListener('keydown', onKey);
      document.getElementById('input').focus();
    };
    overlay.addEventListener('animationend', (e) => e.target === overlay && done());
    setTimeout(() => overlay.isConnected && done(), TIMING.DIALOG_CLOSE_FALLBACK_MS);
  }
  function onKey(e) {
    if (e.key === 'Escape') close();
  }

  async function send() {
    if (!dateInput.value || dateProblem()) {
      triedToSend = true;
      refresh();
      dateText.focus();
      return;
    }
    let last = 0;
    try {
      last = Number(localStorage.getItem('lastSendAt')) || 0;
    } catch (e) {
      // storage blocked: no client-side cooldown, the relay still limits requests
    }
    const wait = Math.ceil((last + SEND_COOLDOWN_MS - Date.now()) / 1000);
    if (wait > 0) {
      status.textContent = `Please wait ${wait} s before sending again`;
      status.className = 'send-status is-error';
      return;
    }
    overlay.dataset.busy = '1';
    refresh();
    sendBtn.textContent = 'Sending…';
    status.textContent = '';
    const request = {
      inscription,
      eventDate: dateInput.value,
      counts: quote.counts,
      usdNo: quote.usdNo,
      usdYes: quote.usdYes,
      bynNo: quote.bynNo,
      bynYes: quote.bynYes,
      pyro: pyroInput.checked, // Telegram shows only the total that matches it
      robinson: defaultPlace.checked,
      fountains: doublePyro.checked,
      rate: USD_RATES || null,
      rateDate,
      weather: weatherFor(dateInput.value),
      music: musicInput.value.trim(),
      website: honeypot.value,
    };
    try {
      // The request goes alone and fast; a track or picture is uploaded afterwards in the background
      const file = attachment
        ? { name: attachment.name, type: fileType(attachment), data: await readAsBase64(attachment) }
        : null;
      const result = await postToRelay(request);
      if (!result.ok) throw new Error(result.error || 'Not sent');
      try {
        localStorage.setItem('lastSendAt', String(Date.now()));
      } catch (e) {
        // ignore
      }
      status.textContent = '✅ Sent to Telegram';
      status.className = 'send-status is-ok';
      // replaceToken: the relay swaps the text message for the track, so the chat gets one message
      if (file) uploadInBackground({ ...request, kind: 'file', replaceToken: result.replaceToken }, file);
      setTimeout(close, attachment ? TIMING.CLOSE_AFTER_SEND_WITH_FILE_MS : TIMING.CLOSE_AFTER_SEND_MS);
    } catch (err) {
      status.textContent = '❌ Not sent: ' + (err.message === 'Failed to fetch' ? 'no connection' : err.message);
      status.className = 'send-status is-error';
      overlay.dataset.busy = '';
      sendBtn.textContent = 'Send ➤';
      refresh();
    }
  }

  closeBtn.addEventListener('click', close);
  cancelBtn.addEventListener('click', close);
  sendBtn.addEventListener('click', send);
  fileInput.addEventListener('change', () => setAttachment(fileInput.files[0] || null));
  drop.addEventListener('click', (e) => {
    if (!attachment && e.target !== fileInput) fileInput.click();
  });
  drop.addEventListener('dragover', (e) => {
    e.preventDefault();
    drop.classList.add('is-over');
  });
  drop.addEventListener('dragleave', () => drop.classList.remove('is-over'));
  drop.addEventListener('drop', (e) => {
    e.preventDefault();
    drop.classList.remove('is-over');
    setAttachment(e.dataTransfer.files[0] || null);
  });
  // Typing: digits only, dots are added automatically (05112026 -> 05.11.2026).
  // A short year works too: 30.11.26 = 30.11.2026 (on leaving the field it is written in full).
  const realDate = (iso) => {
    const check = new Date(iso + 'T00:00');
    return !isNaN(check) && isoDate(check) === iso;
  };
  dateText.addEventListener('input', () => {
    const digits = dateText.value.replace(/\D/g, '').slice(0, 8);
    dateText.value = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)].filter(Boolean).join('.');
    dateError = '';
    dateInput.value = '';
    const day = digits.slice(0, 2);
    const month = digits.slice(2, 4);
    if (digits.length === 8) {
      const iso = `${digits.slice(4)}-${month}-${day}`;
      if (realDate(iso)) dateInput.value = iso;
      else dateError = 'There is no such date';
    } else if (digits.length === 6) {
      // "30.11.20" can also be the start of 2026, so a past short year is treated as "still typing"
      const iso = `20${digits.slice(4)}-${month}-${day}`;
      if (realDate(iso) && iso >= dateInput.min) dateInput.value = iso;
    }
    refresh();
  });
  dateText.addEventListener('blur', () => {
    if (dateInput.value) showDateText();
  });
  // Calendar: a picked date is written into the text field
  dateInput.addEventListener('change', () => {
    dateError = '';
    showDateText();
    refresh();
  });
  // Desktop Chrome opens the calendar only from its own icon; showPicker() opens it on any click
  dateInput.addEventListener('click', () => {
    try {
      dateInput.showPicker();
    } catch (e) {
      // not supported or already open
    }
  });
  overlay.addEventListener('click', (e) => e.target === overlay && close());
  document.addEventListener('keydown', onKey);

  modal.append(header, summary, dateLabel, weatherLine, musicLabel, drop, fileError, honeypot, status, actions);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  refresh();
  setTimeout(() => dateText.focus(), TIMING.FOCUS_DELAY_MS);
}

document.getElementById('inputSend').addEventListener('click', openSendDialog);

// ✕ in the input: removes the whole inscription and resets the result
document.getElementById('inputClear').addEventListener('click', () => {
  const field = document.getElementById('input');
  field.value = '';
  onInput();
  field.focus();
});

input.addEventListener('input', onInput);
heartClick.addEventListener('click', addHeart);
onInput(); // first render: the empty-state hint
defaultPlaceFocus.addEventListener('fullscreenchange', () => {
  input.focus();
});

// =====API

fetch(NBRB_USD_RATE_URL)
  .then((rates) => {
    if (!rates.ok) throw new Error('NBRB API status ' + rates.status);
    return rates.json();
  })
  .then((rates) => getAPI(rates))
  .catch(() => showRate([chipPart('span', 'chip__muted', 'USD rate unavailable')]));

// Read the fields by name: the NBRB response gained "Cur_Code": "840" before "Date",
// so "the first text field" was no longer the date.
function getAPI(response) {
  const rate = response.Cur_OfficialRate;
  if (typeof rate !== 'number' || typeof response.Date !== 'string') {
    showRate([chipPart('span', 'chip__muted', 'USD rate unavailable')]);
    return;
  }
  USD_RATES = rate;
  const dateRateResult = response.Date.slice(0, 10).split('-').reverse().join('.');
  rateDate = dateRateResult;
  // Same pattern as the weather chip: label · value in bold · secondary text
  showRate([
    chipPart('span', 'chip__label', 'USD'),
    chipPart('b', 'chip__value', USD_RATES.toFixed(4)),
    chipPart('span', 'chip__unit', 'BYN'),
    chipPart('span', 'chip__muted rate__date', dateRateResult),
  ]);
  onInput();
}

function showRate(parts) {
  document.getElementById('rate').replaceChildren(...parts);
  fitUnderHeader();
}

function chipPart(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  el.textContent = text;
  return el;
}

// The header height changes with the screen width and its content, so keep the form right under it
function fitUnderHeader() {
  const header = document.querySelector('.topbar');
  document.querySelector('.main').style.paddingTop = header.offsetHeight + LAYOUT.HEADER_GAP + 'px';
  fitResult();
}
window.addEventListener('resize', fitUnderHeader);
fitUnderHeader();

// =====WEATHER (location and codes are in config.js)

const weatherDate = document.getElementById('weatherDate');
const weatherInfo = document.getElementById('weatherInfo');
let forecast = null;

fetch(
  'https://api.open-meteo.com/v1/forecast' +
    `?latitude=${ROBINSON_CLUB.lat}&longitude=${ROBINSON_CLUB.lon}` +
    '&daily=weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max' +
    `&timezone=Europe%2FMinsk&forecast_days=${FORECAST_DAYS}`
)
  .then((res) => {
    if (!res.ok) throw new Error('Open-Meteo status ' + res.status);
    return res.json();
  })
  .then((data) => {
    forecast = data.daily;
    // The API gives today + 15 days; the date picker allows only that range
    weatherDate.min = forecast.time[0];
    weatherDate.max = forecast.time[forecast.time.length - 1];
    weatherDate.value = forecast.time[0];
    showWeather(weatherDate.value);
  })
  .catch(() => {
    weatherDate.disabled = true;
    document.querySelector('.weather__when').hidden = true;
    weatherInfo.replaceChildren(chipPart('span', 'chip__muted', 'Forecast unavailable'));
    fitUnderHeader();
  });

weatherDate.addEventListener('change', () => showWeather(weatherDate.value));
// Phones open the picker on tap; desktop Chrome needs showPicker() when the text part is clicked
weatherDate.addEventListener('click', () => {
  try {
    weatherDate.showPicker();
  } catch (e) {
    // not supported or already open — the native behaviour is enough
  }
});

// Icon · temperature in bold · wind — the condition name is a tooltip on the icon
function showWeather(date) {
  const [y, m, d] = date.split('-');
  document.getElementById('weatherDateFull').textContent = `${d}.${m}.${y}`;
  document.getElementById('weatherDateShort').textContent = `${d}.${m}`;

  const i = forecast ? forecast.time.indexOf(date) : -1;
  if (i < 0) {
    weatherInfo.replaceChildren(chipPart('span', 'chip__muted', 'No forecast'));
    return;
  }
  const [icon, text] = WEATHER_CODES[forecast.weather_code[i]] || ['🌡️', 'Unknown'];
  const iconEl = chipPart('span', 'weather__icon', icon);
  iconEl.title = text;
  weatherInfo.replaceChildren(
    iconEl,
    chipPart(
      'b',
      'chip__value',
      `${Math.round(forecast.temperature_2m_min[i])}…${Math.round(forecast.temperature_2m_max[i])}°C`
    ),
    windPart(Math.round(forecast.wind_speed_10m_max[i]))
  );
  fitUnderHeader();
}

// "💨 22 km/h"; on phones only "💨 22" is shown (the unit is hidden by CSS)
function windPart(speed) {
  const wind = chipPart('span', 'chip__muted', `💨 ${speed}`);
  wind.appendChild(chipPart('span', 'chip__unit', ' km/h'));
  return wind;
}
