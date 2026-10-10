// Client-side cart state, persisted in browser storage.
// Product details (name, price, stock) are cached from API responses so the
// cart can render instantly; checkout always re-fetches fresh data.

import { readJSON, writeJSON } from '../lib/storage.js';
import { addLine, setLineQty, removeLine, cartCount, qtyOfProduct } from '../domain/cart.js';

const KEY = 'medina-atelier:cart';
const listeners = new Set();
const productCache = new Map();

let state = readJSON(KEY, { lines: [], promoCode: '' });
if (!Array.isArray(state.lines)) state = { lines: [], promoCode: '' };

function commit(next) {
  state = { ...state, ...next };
  writeJSON(KEY, state);
  listeners.forEach((fn) => fn(state));
}

export const cart = {
  get lines() {
    return state.lines;
  },
  get promoCode() {
    return state.promoCode;
  },
  get count() {
    return cartCount(state.lines);
  },
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  remember(products) {
    for (const p of [].concat(products)) productCache.set(p.id, p);
  },
  product(id) {
    return productCache.get(id) || null;
  },
  inCart(productId) {
    return qtyOfProduct(state.lines, productId);
  },
  /** Returns how many units were actually added (stock may limit it). */
  add(product, variant, qty) {
    this.remember(product);
    const { lines, added } = addLine(state.lines, { productId: product.id, variant, qty }, product.stock);
    if (added) commit({ lines });
    return added;
  },
  setQty(key, qty) {
    const line = state.lines.find((l) => (l.variant ? `${l.productId}:${l.variant}` : l.productId) === key);
    const stock = line ? productCache.get(line.productId)?.stock ?? Infinity : Infinity;
    commit({ lines: setLineQty(state.lines, key, qty, stock) });
  },
  remove(key) {
    commit({ lines: removeLine(state.lines, key) });
  },
  setPromo(code) {
    commit({ promoCode: code });
  },
  clear() {
    commit({ lines: [], promoCode: '' });
  },
};

/* The customer's own order ids (this browser only). */
const ORDERS_KEY = 'medina-atelier:my-orders';
export const myOrders = {
  ids: () => readJSON(ORDERS_KEY, []),
  add(id) {
    writeJSON(ORDERS_KEY, [id, ...this.ids().filter((x) => x !== id)].slice(0, 50));
  },
};

/* Delivery details remembered for the next checkout. */
const CUSTOMER_KEY = 'medina-atelier:customer';
export const savedCustomer = {
  get: () => readJSON(CUSTOMER_KEY, null),
  set: (c) => writeJSON(CUSTOMER_KEY, c),
};
