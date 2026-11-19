/** @format */
// Fixed values of the calculator in one place: addresses, limits, letters in stock, weather codes.
// js_App-calc.js imports them; change a value here, not in the code.

// ================ TELEGRAM
// URL of the Google Apps Script web app (telegram-relay/Code.gs) that sends requests to Telegram.
// Empty = the ➤ "Send" button stays hidden. The bot token is NOT here: it lives only in the script's properties.
export const TELEGRAM_RELAY_URL = 'https://script.google.com/macros/s/AKfycbzkYke_RsojWBlxxdiOMdLuSNZpBQsiwseX_D7mP6pSy-3jwwMD1_P8QihiV23gO1iE2w/exec';
export const SEND_COOLDOWN_MS = 30000; // one request per 30 s from this browser
export const MAX_AUDIO_MB = 20; // attachment limits: Telegram bots can upload up to 50 MB, a phone upload must stay quick
export const MAX_IMAGE_MB = 10; // Telegram's limit for photos
// iPhone: "audio/*" alone greys out MP3 files in the Files app, so the extensions are listed explicitly
export const ATTACH_ACCEPT = '.mp3,.m4a,.aac,.wav,.ogg,.flac,audio/mpeg,audio/mp4,audio/*,image/*';
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
