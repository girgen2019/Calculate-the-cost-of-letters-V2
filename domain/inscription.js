/** @format */
// The inscription: what is a letter and what is a heart. Pure logic, does not touch the page.
import { HEART_CHAR_CODE } from '../config.js?v=20261119b';

// ❤ — the heart button adds it to the inscription; it is priced as a heart, not as a letter
export const HEART = String.fromCharCode(HEART_CHAR_CODE);

export const isHeart = (ch) => ch === HEART;

// Text from the input -> its characters (lower case, spaces dropped) and how many of them are
// letters and hearts; units = letters + hearts, each one is a physical piece of the show.
// "Мама ❤" -> { chars: ['м', 'а', 'м', 'а', '❤'], letters: 4, hearts: 1, units: 5 }
export function parseInscription(text) {
  const chars = String(text)
    .toLowerCase()
    .split('')
    .filter((ch) => ch.trim());
  const hearts = chars.filter(isHeart).length;
  return { chars, letters: chars.length - hearts, hearts, units: chars.length };
}
