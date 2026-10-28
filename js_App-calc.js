/** @format */
let USD_RATES;
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
  checkString(text.trim());
}

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
