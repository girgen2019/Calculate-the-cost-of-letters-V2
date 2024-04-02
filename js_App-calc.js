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

doublePyro.addEventListener('click', () => {
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
  const TOTAL_SUM_NoPyrotechnicsBYN =
    prepareResultsNoBYN + Math.ceil(addFiveBaks() * USD_RATES) + ' BYN';
  prepareResultsNoBYN + Math.ceil(addFiveBaks() * USD_RATES) + ' BYN';
  const TOTAL_SUM_YesPyrotechnicsBYN =
    prepareResultsYesBYN + Math.ceil(addFiveBaks() * USD_RATES) + ' BYN';
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
      (sumLetters + sumHearts) * 7 +
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
    return 14;
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
  let input = document.querySelector('input');
  let output = document.getElementById('output');
  let inputString = '';
  spanInput.textContent = input.value;
  inputString += input.value;
  checkString(inputString);

  if (inputString.length < 1) {
    totalSumUSD_NOPyro.classList.remove('sumUSD');
    totalSumUSD_NOPyroBolt.classList.remove('newClass');
    totalSumUSD_YESPyro.classList.remove('sumUSD');
    totalSumUSD_YESPyroBolt.classList.remove('newClass');
    lengthOutputStringBolt.classList.remove('newClass');
    output.classList.add('container__out-hidden');
    spanInput.textContent = "it isn't written yet...";
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
defaultPlaceFocus.addEventListener('click', () => {
  input.focus();
});

// =====API

let API = fetch('https://www.nbrb.by/api/exrates/rates/431');
API.then((rates) => rates.json()).then((rates) => getAPI(rates));

function getAPI(response) {
  let keyAPI = [];
  try {
    let mapAPI = Object.values(response);
    let body = document.querySelector('.main');
    let divRate = document.createElement('div');
    divRate.classList.add('api_container');
    if (mapAPI !== undefined || mapAPI !== null) {
      for (let key of mapAPI) {
        keyAPI.push(key);
      }
    }
    if (USD_RATES !== undefined || USD_RATES !== null) {
      USD_RATES = keyAPI.find(
        (rate) => !Number.isInteger(rate) && typeof rate === 'number'
      );
      let dateRate = keyAPI.find((date) => typeof date === 'string');
      let dateRateResult = dateRate
        .split('-')
        .map((date) => (date.length > 5 ? date.slice(0, 2) : date))
        .reverse()
        .join('.');
      divRate.textContent = dateRateResult + ' ---- ' + USD_RATES + ' byn';
      body.appendChild(divRate);
    } else {
      USD_RATES = 1;
    }
  } catch (error) {
    keyAPI.push(1);
  }
}
