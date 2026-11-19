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

// Both prices in USD, rounded up; the Robinson club surcharge is added later, on top.
// fountains — the "Double fountains" surcharge in USD
export function basePrices(letters, hearts, fountains) {
  const discounted = discountedSum(letters, hearts);
  return {
    usdNo: Math.ceil(discounted + fountains),
    usdYes: Math.ceil(discounted + (letters + hearts) * PRICE.PYRO_PER_UNIT + fountains),
  };
}
