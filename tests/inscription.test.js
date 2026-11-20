/** @format */
// domain/inscription.js: how the text from the input becomes letters and hearts (npm test, no browser)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HEART, isHeart, parseInscription } from '../domain/inscription.js';

test('HEART is ❤, and only it is a heart', () => {
  assert.equal(HEART, '❤');
  assert.equal(isHeart('❤'), true);
  assert.equal(isHeart('м'), false);
  assert.equal(isHeart(' '), false);
  assert.equal(isHeart('♥'), false); // a different heart symbol is priced as a letter
});

test('letters only', () => {
  assert.deepEqual(parseInscription('мама'), { chars: ['м', 'а', 'м', 'а'], letters: 4, hearts: 0, units: 4 });
});

test('upper case becomes lower case, spaces are not counted', () => {
  assert.deepEqual(parseInscription('Мама ❤'), { chars: ['м', 'а', 'м', 'а', '❤'], letters: 4, hearts: 1, units: 5 });
  assert.deepEqual(parseInscription('  М а  '), { chars: ['м', 'а'], letters: 2, hearts: 0, units: 2 });
});

test('several hearts and letters between them', () => {
  const { letters, hearts, units } = parseInscription('с днём ❤❤');
  assert.deepEqual({ letters, hearts, units }, { letters: 5, hearts: 2, units: 7 });
  assert.deepEqual(parseInscription('❤❤❤'), { chars: ['❤', '❤', '❤'], letters: 0, hearts: 3, units: 3 });
});

test('empty text and only spaces give nothing', () => {
  for (const text of ['', '   ', '\t \n']) {
    assert.deepEqual(parseInscription(text), { chars: [], letters: 0, hearts: 0, units: 0 }, JSON.stringify(text));
  }
});

test('letters + hearts always equal units', () => {
  for (const text of ['а', 'Привет', 'любовь навсегда', 'с днём рождения ❤❤❤', 'ааааааааааааааа']) {
    const { chars, letters, hearts, units } = parseInscription(text);
    assert.equal(letters + hearts, units, text);
    assert.equal(chars.length, units, text);
  }
});
