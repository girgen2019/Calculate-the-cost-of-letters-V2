/** @format */
import { HEART_CHAR_CODE } from '../config.js?v=20261119b';

export const HEART = String.fromCharCode(HEART_CHAR_CODE);

export const isHeart = (ch) => ch === HEART;

export function parseInscription(text) {
  const chars = String(text)
    .toLowerCase()
    .split('')
    .filter((ch) => ch.trim());
  const hearts = chars.filter(isHeart).length;
  return { chars, letters: chars.length - hearts, hearts, units: chars.length };
}
