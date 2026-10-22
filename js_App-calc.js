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
  switch (select.value) {
    case '1':
      break;
    case '2':
      let popup = document.createElement('div');
      let main = document.querySelector('main');
      let close = document.createElement('div');
      let popupInput = document.createElement('input');
      let popupOutput = document.createElement('span');
      popupInput.setAttribute('type', 'text');
      popupInput.classList.add('popupInput');
      popupOutput.classList.add('popupOutput');
      let tagFind = document.createElement('div');
      let tagFindResult = document.createElement('b');
      tagFindResult.classList.add('tagFindResult');
      popupOutput.appendChild(tagFind);
      popupOutput.appendChild(tagFindResult);
      const tagNOTFound = document.createElement('div');
      const tagNOTFoundResult = document.createElement('b');
      tagFind.classList.add('showResultPopup');
      tagNOTFoundResult.classList.add('tagNOTFoundResult');
      popupOutput.appendChild(tagNOTFound);
      popupOutput.appendChild(tagNOTFoundResult);
      popupInput.placeholder = 'check';
      function popUpFocus() {
        setTimeout(() => {
          popupInput.focus();
        }, 100);
      }
      if (popupInput) {
        popUpFocus();
      }
      // ================ CHECK
      const letters = [
        'е',
        'е',
        'е',
        'е',
        'е',
        'н',
        'н',
        'н',
        'я',
        'я',
        'я',
        'м',
        'м',
        'м',
        'б',
        'т',
        'т',
        'а',
        'а',
        'а',
        'з',
        'и',
        'и',
        'и',
        'д',
        'д',
        'д',
        'х',
        'в',
        'в',
        'ы',
        'ч',
        'к',
        'к',
        'л',
        'л',
        'о',
        'о',
        'с',
        'с',
        'р',
        'р',
        'п',
        'п',
        'э',
        'ж',
        'ю',
        'ш',
      ];
      function ShowFoundLetters([...alphabetArray], checkLetters) {
        let result = [];
        let notFound = [];
        let checkArray = checkLetters
          .toLowerCase()
          .split('')
          .filter((letter) => letter.trim());

        if (checkLetters.length === 0) {
        }
        input1: for (let index1 = 0; index1 < checkArray.length; index1++) {
          const elementsLettersArray = checkArray[index1];
          input2: for (
            let index2 = 0;
            index2 < alphabetArray.length;
            index2++
          ) {
            const elementsAlphabetArray = alphabetArray[index2];

            if (elementsLettersArray === elementsAlphabetArray) {
              result.push(elementsLettersArray);
              alphabetArray.splice(index2, 1);
              continue input1;
            }
            if (!alphabetArray.includes(elementsLettersArray)) {
              notFound.push(elementsLettersArray);
              break input2;
            }
          }
        }

        tagFind.textContent = 'Found letters';
        tagFindResult.textContent = `${result.join('')}  ---  length ${
          result.length
        }`;
        tagNOTFound.textContent = 'NOT Found';
        tagNOTFoundResult.textContent = `${notFound.join('')} --- length ${
          notFound.length
        } `;
      }

      // ================ CHECK
      popupInput.addEventListener('input', () => {
        let checkSting = '';
        checkSting += popupInput.value;

        ShowFoundLetters(letters, popupInput.value);
      });

      close.textContent = 'X';
      close.classList.add('close');
      close.onclick = function () {
        popup.classList.remove('popup');
        popup.textContent = '';
        select.value = 1;
        input.focus();
      };
      popup.appendChild(close);
      popup.appendChild(popupInput);
      popup.appendChild(popupOutput);
      popup.classList.add('popup');
      main.appendChild(popup);

      break;
    default:
      break;
  }
});

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
  .catch(() => showRate('USD rate is unavailable — prices in BYN are not shown'));

// Read the fields by name: the NBRB response gained "Cur_Code": "840" before "Date",
// so "the first text field" was no longer the date.
function getAPI(response) {
  const rate = response.Cur_OfficialRate;
  if (typeof rate !== 'number' || typeof response.Date !== 'string') {
    showRate('USD rate is unavailable — prices in BYN are not shown');
    return;
  }
  USD_RATES = rate;
  const dateRateResult = response.Date.slice(0, 10).split('-').reverse().join('.');
  showRate(dateRateResult + ' ---- ' + USD_RATES + ' byn');
  onInput();
}

function showRate(text) {
  document.getElementById('rate').textContent = text;
  fitUnderHeader();
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
    '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max' +
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
    weatherInfo.textContent = 'Forecast unavailable';
    fitUnderHeader();
  });

weatherDate.addEventListener('change', () => showWeather(weatherDate.value));

function showWeather(date) {
  const i = forecast ? forecast.time.indexOf(date) : -1;
  if (i < 0) {
    weatherInfo.textContent = 'No forecast for this date (up to 16 days ahead)';
    return;
  }
  const [icon, text] = WEATHER_CODES[forecast.weather_code[i]] || ['🌡️', 'Unknown'];
  const rain = forecast.precipitation_probability_max[i];
  weatherInfo.textContent =
    `${icon} ${text}, ${Math.round(forecast.temperature_2m_min[i])}…` +
    `${Math.round(forecast.temperature_2m_max[i])} °C · 💧 ${rain === null ? '—' : rain + '%'}` +
    ` · 💨 ${Math.round(forecast.wind_speed_10m_max[i])} km/h`;
  fitUnderHeader();
}
