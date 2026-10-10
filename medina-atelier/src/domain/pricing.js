// Pricing rules: promo codes, delivery fees and order totals.
// All amounts are whole dinars (DA). These functions are pure so the same
// rules run in the cart, at checkout, and again on the "server" when the
// order is placed (the client's numbers are never trusted).

export const FREE_SHIPPING_THRESHOLD = 15000;

/** Delivery fee by zone and method ('home' = to the door, 'desk' = pick up at a relay point). */
export const SHIPPING_FEES = {
  1: { home: 400, desk: 250 },
  2: { home: 600, desk: 400 },
  3: { home: 850, desk: 550 },
  4: { home: 1300, desk: 900 },
};

export const PROMO_CODES = {
  BIENVENUE10: { code: 'BIENVENUE10', type: 'percent', value: 10, minSubtotal: 0, label: '10% off your order' },
  ATELIER2000: { code: 'ATELIER2000', type: 'fixed', value: 2000, minSubtotal: 20000, label: '2 000 DA off orders over 20 000 DA' },
};

export function normalizeCode(code) {
  return String(code || '').trim().toUpperCase();
}

/** Returns { promo } if the code applies to this subtotal, otherwise { error }. */
export function checkPromo(code, subtotal) {
  const key = normalizeCode(code);
  if (!key) return { promo: null, error: null };
  const promo = PROMO_CODES[key];
  if (!promo) return { promo: null, error: 'This code does not exist.' };
  if (subtotal < promo.minSubtotal) {
    return { promo: null, error: `This code needs a subtotal of at least ${promo.minSubtotal.toLocaleString('fr-FR')} DA.` };
  }
  return { promo, error: null };
}

export function shippingFee(zone, method) {
  const row = SHIPPING_FEES[zone];
  if (!row || !(method in row)) return null;
  return row[method];
}

/**
 * @param {{lines: {unitPrice:number, qty:number}[], promoCode?: string, zone?: number, method?: 'home'|'desk'}} input
 */
export function computeTotals({ lines, promoCode, zone, method }) {
  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);
  const { promo, error: promoError } = checkPromo(promoCode, subtotal);

  let discount = 0;
  if (promo) discount = promo.type === 'percent' ? Math.round((subtotal * promo.value) / 100) : Math.min(promo.value, subtotal);

  const freeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const fee = zone && method ? shippingFee(zone, method) : null;
  const shipping = fee == null ? null : freeShipping ? 0 : fee;

  return {
    subtotal,
    discount,
    shipping, // null until a wilaya and delivery method are chosen
    total: subtotal - discount + (shipping ?? 0),
    promo,
    promoError,
    freeShipping,
    freeShippingRemaining: Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal),
  };
}
