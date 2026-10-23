/** @format */
let USD_RATES;
let defaultPlace = document.getElementById('robinson');
let defaultPlaceFocus = document.querySelector('.container__controls');
let doublePyro = document.getElementById('double');
let spanInput = document.createElement('span');
let outputStringConsist = document.createElement('div');
let outputSimpleString = document.createElement('b');
let lengthOutputString = document.createElement('div');
let lengthOutputStringBolt = document.createElement('b');
let totalSumUSD_NOPyro = document.createElement('div');
let totalSumUSD_NOPyroBolt = document.createElement('b');
let totalSumUSD_YESPyro = document.createElement('div');
let totalSumUSD_YESPyroBolt = document.createElement('b');
spanInput.classList.add('newClass');
outputSimpleString.classList.add('newClass');
lengthOutputStringBolt.classList.add('newClass');
totalSumUSD_NOPyro.classList.add('sumUSD');
totalSumUSD_NOPyroBolt.classList.add('newClass');
totalSumUSD_YESPyro.classList.add('sumUSD');
totalSumUSD_YESPyroBolt.classList.add('newClass');
let heartClick = document.getElementById('heart');
const heartCharCode = String.fromCharCode(10084);

const select = document.getElementById('selectbox');
select.addEventListener('change', () => {
  if (select.value === '2') openLettersCheck();
});

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
      select.value = '1';
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

function getResult(
  checkedString,
  prepareResultsNoUSD,
  prepareResultsYesUSD,
  prepareResultsNoBYN,
  prepareResultsYesBYN
) {
  outputSimpleString.textContent = checkedString;
  lengthOutputStringBolt.textContent =
    checkedString.length > 1
      ? checkedString.length + ' units'
      : checkedString.length + ' unit';
  // Without a rate (API unavailable) show that BYN is unknown instead of "NaN BYN"
  const TOTAL_SUM_NoPyrotechnicsBYN = USD_RATES
    ? prepareResultsNoBYN + Math.round(addFiveBaks() * USD_RATES) + ' BYN'
    : 'BYN n/a';
  const TOTAL_SUM_YesPyrotechnicsBYN = USD_RATES
    ? prepareResultsYesBYN + Math.round(addFiveBaks() * USD_RATES) + ' BYN'
    : 'BYN n/a';
  totalSumUSD_NOPyroBolt.textContent =
    prepareResultsNoUSD +
    addFiveBaks() +
    ' usd / ' +
    TOTAL_SUM_NoPyrotechnicsBYN;
  totalSumUSD_YESPyroBolt.textContent =
    prepareResultsYesUSD +
    addFiveBaks() +
    ' usd / ' +
    TOTAL_SUM_YesPyrotechnicsBYN;
  defaultPlace.addEventListener('click', addFiveBaks);
  outputStringConsist.textContent = `String consist of --- `;
  lengthOutputString.textContent = `Length of string --- `;
  totalSumUSD_NOPyro.textContent = `Total amount ${'NO pyrotechnics'.toUpperCase()}  --- `;
  lengthOutputString.appendChild(lengthOutputStringBolt);
  totalSumUSD_NOPyro.appendChild(totalSumUSD_NOPyroBolt);
  totalSumUSD_YESPyro.textContent = `Total amount ${'YES pyrotechnics'.toUpperCase()}  --- `;
  totalSumUSD_YESPyro.appendChild(totalSumUSD_YESPyroBolt);
}

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
    resultWithPyrotechnicsBYN
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
  let input = document.getElementById('input');
  let output = document.getElementById('output');
  let sliceHidden = document.querySelector('.output_container');
  let inputString = '';
  console.dir(input);

  spanInput.textContent = input.value;
  inputString += input.value.trim();
  checkString(inputString);

  if (inputString.length < 1) {
    totalSumUSD_NOPyro.classList.remove('sumUSD');
    totalSumUSD_NOPyroBolt.classList.remove('newClass');
    totalSumUSD_YESPyro.classList.remove('sumUSD');
    totalSumUSD_YESPyroBolt.classList.remove('newClass');
    lengthOutputStringBolt.classList.remove('newClass');
    output.classList.add('container__out-hidden');
    // sliceHidden.textContent = "it isn't written yet...";
  } else if (inputString.length >= 1) {
    totalSumUSD_NOPyro.classList.add('sumUSD');
    totalSumUSD_NOPyroBolt.classList.add('newClass');
    totalSumUSD_YESPyro.classList.add('sumUSD');
    totalSumUSD_YESPyroBolt.classList.add('newClass');
    lengthOutputStringBolt.classList.add('newClass');
    output.classList.remove('container__out-hidden');
  }

  output.appendChild(spanInput);
  output.appendChild(outputStringConsist);
  output.appendChild(outputSimpleString);
  output.appendChild(lengthOutputString);
  output.appendChild(totalSumUSD_NOPyro);
  output.appendChild(totalSumUSD_YESPyro);
}

input.addEventListener('input', onInput);
heartClick.addEventListener('click', addHeart);
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
