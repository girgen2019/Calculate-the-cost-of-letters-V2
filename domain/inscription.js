/** @format */
// The inscription: what is a letter and what is a heart. Pure logic, does not touch the page.
import { HEART_CHAR_CODE } from '../config.js?v=20261119b';

// ❤ — the heart button adds it to the inscription; it is priced as a heart, not as a letter
export const HEART = String.fromCharCode(HEART_CHAR_CODE);

export const isHeart = (ch) => ch === HEART;
