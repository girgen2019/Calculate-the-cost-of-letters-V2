/** @format */
// Fixed values of the calculator in one place: prices, addresses, limits, letters in stock, weather, layout and timings.
// js_App-calc.js imports them; change a value here, not in the code.

// ================ PRICES (USD)
export const PRICE = {
  LETTER: 15, // one letter
  HEART: 25, // one heart
  DISCOUNT_FROM: 30, // everything above 30 USD costs half: (sum - 30) / 2 + 30
  DISCOUNT_DIVIDER: 2,
  PYRO_PER_UNIT: 8, // pyrotechnics for each letter or heart
  DOUBLE_FOUNTAINS: 16, // "Double fountains" option
  ROBINSON_CLUB: 5, // "Robinson club" venue surcharge
};
export const HEART_CHAR_CODE = 10084; // ❤

// ================ USD RATE
export const NBRB_USD_RATE_URL = 'https://api.nbrb.by/exrates/rates/431'; // 431 = USD in the NBRB API

// ================ TELEGRAM
// URL of the Google Apps Script web app (telegram-relay/Code.gs) that sends requests to Telegram.
// Empty = the ➤ "Send" button stays hidden. The bot token is NOT here: it lives only in the script's properties.
export const TELEGRAM_RELAY_URL = 'https://script.google.com/macros/s/AKfycbzkYke_RsojWBlxxdiOMdLuSNZpBQsiwseX_D7mP6pSy-3jwwMD1_P8QihiV23gO1iE2w/exec';
export const SEND_COOLDOWN_MS = 30000; // one request per 30 s from this browser
export const MAX_AUDIO_MB = 20; // attachment limits: Telegram bots can upload up to 50 MB, a phone upload must stay quick
export const MAX_IMAGE_MB = 10; // Telegram's limit for photos
// iPhone: "audio/*" alone greys out MP3 files in the Files app, so the extensions are listed explicitly
export const ATTACH_ACCEPT = '.mp3,.m4a,.aac,.wav,.ogg,.flac,audio/mpeg,audio/mp4,audio/*,image/*';
export const MAX_MUSIC_LENGTH = 200; // music field: track name or link
export const UPLOAD_ATTEMPTS = 3; // a phone upload is retried when the page comes back from the background
export const AUDIO_TYPES = { mp3: 'audio/mpeg', m4a: 'audio/mp4', aac: 'audio/aac', wav: 'audio/wav', ogg: 'audio/ogg', flac: 'audio/flac' };

// ================ LETTERS CHECK
// Physical letters in stock: a word can only be assembled from these
export const STOCK_LETTERS = [
  'е', 'е', 'е', 'е', 'е', 'н', 'н', 'н', 'я', 'я', 'я', 'м', 'м', 'м', 'б', 'т', 'т',
  'а', 'а', 'а', 'з', 'и', 'и', 'и', 'д', 'д', 'д', 'х', 'в', 'в', 'ы', 'ч', 'к', 'к',
  'л', 'л', 'о', 'о', 'с', 'с', 'р', 'р', 'п', 'п', 'э', 'ж', 'ю', 'ш',
];

// ================ WEATHER — fixed location: Robinson Club, Minsk District (shore of the Minsk Sea)
export const ROBINSON_CLUB = { lat: 53.9508, lon: 27.3387 };
export const FORECAST_DAYS = 16; // Open-Meteo gives today + 15 days
export const WEATHER_CODES = {
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

// ================ LAYOUT (px) AND TIMINGS (ms)
export const LAYOUT = {
  BREAKDOWN_OPEN_MIN_HEIGHT: 900, // the price breakdown starts open on windows at least this tall
  RESULT_BOTTOM_GAP: 16, // space between the result and the bottom of the window
  RESULT_MIN_HEIGHT: 260, // less room than this (phone in landscape): no height limit, the page scrolls
  HEADER_GAP: 12, // space between the header and the form
};
export const TIMING = {
  DIALOG_CLOSE_FALLBACK_MS: 400, // closes a dialog if the closing animation does not report its end
  FOCUS_DELAY_MS: 50, // focus a dialog field after it appears
  TOAST_OK_MS: 4000, // "Track sent" pill
  TOAST_ERROR_MS: 9000, // error pill stays longer
  CLOSE_AFTER_SEND_MS: 1500, // the send dialog closes after "Sent"
  CLOSE_AFTER_SEND_WITH_FILE_MS: 700, // faster when a file keeps uploading in the background
};
