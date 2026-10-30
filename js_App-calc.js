/** @format */
let USD_RATES;
// URL of the Google Apps Script web app (telegram-relay/Code.gs) that sends requests to Telegram.
// Empty = the ➤ "Send" button stays hidden. The bot token is NOT here: it lives only in the script's properties.
const TELEGRAM_RELAY_URL = 'https://script.google.com/macros/s/AKfycbzkYke_RsojWBlxxdiOMdLuSNZpBQsiwseX_D7mP6pSy-3jwwMD1_P8QihiV23gO1iE2w/exec';
const SEND_COOLDOWN_MS = 30000; // one request per 30 s from this browser
const MAX_AUDIO_MB = 20; // attachment limits: Telegram bots can upload up to 50 MB, a phone upload must stay quick
const MAX_IMAGE_MB = 10; // Telegram's limit for photos
let lastQuote = null; // what the price cards show now, for the "Send" dialog
let rateDate = ''; // date of the NBRB rate, e.g. "30.10.2026"
let defaultPlace = document.getElementById('robinson');
let defaultPlaceFocus = document.querySelector('.container__controls');
let doublePyro = document.getElementById('double');
let heartClick = document.getElementById('heart');
const heartCharCode = String.fromCharCode(10084);

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
// Physical letters in stock: a word can only be assembled from these
const STOCK_LETTERS = [
  'е', 'е', 'е', 'е', 'е', 'н', 'н', 'н', 'я', 'я', 'я', 'м', 'м', 'м', 'б', 'т', 'т',
  'а', 'а', 'а', 'з', 'и', 'и', 'и', 'д', 'д', 'д', 'х', 'в', 'в', 'ы', 'ч', 'к', 'к',
  'л', 'л', 'о', 'о', 'с', 'с', 'р', 'р', 'п', 'п', 'э', 'ж', 'ю', 'ш',
];

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
    setTimeout(() => overlay.isConnected && done(), 400); // fallback if animations are off
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
  setTimeout(() => field.focus(), 50);
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
    chars.map((ch) => ch.trim()),
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
  const pyro = (letters + hearts) * 8;
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
  rows.push([`Pyrotechnics ${letters + hearts} × 8`, pyro]);
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
  if (breakdownOpen === null) breakdownOpen = window.innerHeight >= 900;
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

  const letters = chars.filter((ch) => ch !== heartCharCode).length;
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
      lettersEl('span', 'letters-key ' + (ch === heartCharCode ? 'letters-key--heart' : 'letters-key--found'), ch)
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
  const free = window.innerHeight - output.getBoundingClientRect().top - 16;
  // Too little room (phone in landscape): no limit, the page scrolls instead (see CSS max-height: 520px)
  output.style.maxHeight = free >= 260 ? free + 'px' : '';
}
window.addEventListener('resize', fitResult);

function prepareResult(array) {
  let sumHearts = array.filter((hearts) => {
    return hearts.trim().charCodeAt() === 10084;
  }).length;

  let sumLetters = array.filter(
    (letters) => !letters.includes(heartCharCode)
  ).length;

  let resultNoPyrotechnics = Math.ceil(
    (sumLetters * 15 + sumHearts * 25 - 30) / 2 + 30 + addDoubleFountain()
  );
  let resultWithPyrotechnics = Math.ceil(
    (sumLetters * 15 + sumHearts * 25 - 30) / 2 +
      30 +
      (sumLetters + sumHearts) * 8 +
      addDoubleFountain()
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
  if (doublePyro.checked) {
    return 16;
  } else {
    return 0;
  }
}

function addFiveBaks() {
  if (defaultPlace.checked) {
    input.focus();
    return 5;
  } else {
    input.focus();
    return 0;
  }
}

function checkString(str) {
  let inputStringArray = str
    .toLowerCase()
    .split('')
    .filter((element) => element.trim())
    .map((element) => ` ${element}`);
  prepareResult(inputStringArray);
}

function addHeart() {
  input.value += heartCharCode;
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

function openSendDialog() {
  const inscription = document.getElementById('input').value.trim();
  if (!inscription || !lastQuote || document.querySelector('.letters-overlay')) return;
  const quote = { ...lastQuote };

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

  const summary = lettersEl('div', 'send-summary');
  summary.append(
    lettersEl('div', 'result__word', inscription),
    lettersEl('div', 'send-prices', `${quote.usdNo} USD without pyrotechnics · ${quote.usdYes} USD with pyrotechnics`)
  );

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
  musicInput.maxLength = 200;
  musicInput.placeholder = 'Track name or link (optional)';
  musicLabel.appendChild(musicInput);

  // Attachment: an MP3 (or other audio) or a picture, dropped here or chosen from the device.
  // It is previewed (audio can be played) and sent to Telegram as a playable track / photo.
  let attachment = null;
  let attachmentUrl = '';
  const drop = lettersEl('div', 'send-drop');
  const fileInput = lettersEl('input', 'send-file');
  fileInput.type = 'file';
  fileInput.accept = 'audio/*,image/*';
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
    const kind = file.type.startsWith('audio/') ? 'audio' : file.type.startsWith('image/') ? 'image' : '';
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
  }

  const readAsBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1]);
      reader.onerror = () => reject(new Error('could not read the file'));
      reader.readAsDataURL(file);
    });

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

  function refresh() {
    const past = dateInput.value && dateInput.value < dateInput.min;
    const weather = dateInput.value && !past ? weatherFor(dateInput.value) : '';
    weatherLine.textContent =
      dateError ||
      (past ? 'This date has already passed' : weather || (dateInput.value ? 'No forecast for this date yet' : 'Pick the event date'));
    weatherLine.classList.toggle('is-error', Boolean(dateError || past));
    sendBtn.disabled = !dateInput.value || dateInput.value < dateInput.min || overlay.dataset.busy === '1';
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
    setTimeout(() => overlay.isConnected && done(), 400);
  }
  function onKey(e) {
    if (e.key === 'Escape') close();
  }

  async function send() {
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
    sendBtn.textContent = attachment ? 'Uploading…' : 'Sending…';
    status.textContent = '';
    try {
      const file = attachment
        ? { name: attachment.name, type: attachment.type, data: await readAsBase64(attachment) }
        : null;
      // text/plain: a "simple" request, so the browser sends no CORS preflight that Apps Script can't answer
      const res = await fetch(TELEGRAM_RELAY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          inscription,
          eventDate: dateInput.value,
          counts: quote.counts,
          usdNo: quote.usdNo,
          usdYes: quote.usdYes,
          bynNo: quote.bynNo,
          bynYes: quote.bynYes,
          robinson: defaultPlace.checked,
          fountains: doublePyro.checked,
          rate: USD_RATES || null,
          rateDate,
          weather: weatherFor(dateInput.value),
          music: musicInput.value.trim(),
          file,
          website: honeypot.value,
        }),
      });
      const result = await res.json();
      if (!result.ok) throw new Error(result.error || 'Not sent');
      try {
        localStorage.setItem('lastSendAt', String(Date.now()));
      } catch (e) {
        // ignore
      }
      // The request went through, but the file can still be refused by Telegram (e.g. wrong format)
      if (result.fileError) {
        status.textContent = '✅ Sent, but the file was not: ' + result.fileError;
        status.className = 'send-status is-error';
        overlay.dataset.busy = '';
        sendBtn.textContent = 'Send ➤';
        refresh();
        return;
      }
      status.textContent = '✅ Sent to Telegram';
      status.className = 'send-status is-ok';
      setTimeout(close, 1500);
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
  // Typing: digits only, dots are added automatically (05112026 -> 05.11.2026)
  dateText.addEventListener('input', () => {
    const digits = dateText.value.replace(/\D/g, '').slice(0, 8);
    dateText.value = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)].filter(Boolean).join('.');
    dateError = '';
    dateInput.value = '';
    if (digits.length === 8) {
      const iso = `${digits.slice(4)}-${digits.slice(2, 4)}-${digits.slice(0, 2)}`;
      const check = new Date(iso + 'T00:00');
      if (!isNaN(check) && isoDate(check) === iso) dateInput.value = iso;
      else dateError = 'There is no such date';
    }
    refresh();
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
  setTimeout(() => dateText.focus(), 50);
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

fetch('https://api.nbrb.by/exrates/rates/431')
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
  document.querySelector('.main').style.paddingTop = header.offsetHeight + 12 + 'px';
  fitResult();
}
window.addEventListener('resize', fitUnderHeader);
fitUnderHeader();

// =====WEATHER — fixed location: Robinson Club, Minsk District (shore of the Minsk Sea)

const ROBINSON_CLUB = { lat: 53.9508, lon: 27.3387 };
const WEATHER_CODES = {
  0: ['☀️', 'Clear'],
  1: ['🌤️', 'Mainly clear'],
  2: ['⛅', 'Partly cloudy'],
  3: ['☁️', 'Overcast'],
  45: ['🌫️', 'Fog'],
  48: ['🌫️', 'Rime fog'],
  51: ['🌦️', 'Light drizzle'],
  53: ['🌦️', 'Drizzle'],
  55: ['🌧️', 'Dense drizzle'],
  56: ['🌧️', 'Freezing drizzle'],
  57: ['🌧️', 'Freezing drizzle'],
  61: ['🌧️', 'Light rain'],
  63: ['🌧️', 'Rain'],
  65: ['🌧️', 'Heavy rain'],
  66: ['🌧️', 'Freezing rain'],
  67: ['🌧️', 'Freezing rain'],
  71: ['🌨️', 'Light snow'],
  73: ['🌨️', 'Snow'],
  75: ['❄️', 'Heavy snow'],
  77: ['🌨️', 'Snow grains'],
  80: ['🌦️', 'Rain showers'],
  81: ['🌧️', 'Rain showers'],
  82: ['⛈️', 'Violent rain showers'],
  85: ['🌨️', 'Snow showers'],
  86: ['❄️', 'Heavy snow showers'],
  95: ['⛈️', 'Thunderstorm'],
  96: ['⛈️', 'Thunderstorm with hail'],
  99: ['⛈️', 'Thunderstorm with hail'],
};

const weatherDate = document.getElementById('weatherDate');
const weatherInfo = document.getElementById('weatherInfo');
let forecast = null;

fetch(
  'https://api.open-meteo.com/v1/forecast' +
    `?latitude=${ROBINSON_CLUB.lat}&longitude=${ROBINSON_CLUB.lon}` +
    '&daily=weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max' +
    '&timezone=Europe%2FMinsk&forecast_days=16'
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
