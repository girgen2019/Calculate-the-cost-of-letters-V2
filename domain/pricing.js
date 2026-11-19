/** @format */
// Price of an inscription. Pure logic: gets numbers, returns numbers, does not touch the page.
import { PRICE } from '../config.js?v=20261119b';

// Letters and hearts with the discount: everything above DISCOUNT_FROM costs half
export function discountedSum(letters, hearts) {
  return (
    (letters * PRICE.LETTER + hearts * PRICE.HEART - PRICE.DISCOUNT_FROM) / PRICE.DISCOUNT_DIVIDER +
    PRICE.DISCOUNT_FROM
  );
}

// Options in USD: on = the checkbox is ticked
export const fountainsPrice = (on) => (on ? PRICE.DOUBLE_FOUNTAINS : 0);
export const robinsonPrice = (on) => (on ? PRICE.ROBINSON_CLUB : 0);

// Both prices in USD, rounded up; the Robinson club surcharge is added later, on top.
// fountains — is "Double fountains" ticked
export function basePrices(letters, hearts, fountains) {
  const discounted = discountedSum(letters, hearts);
  const options = fountainsPrice(fountains);
  return {
    usdNo: Math.ceil(discounted + options),
    usdYes: Math.ceil(discounted + (letters + hearts) * PRICE.PYRO_PER_UNIT + options),
  };
}
