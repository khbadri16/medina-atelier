// Persistence for the demo "server": one JSON document in browser storage.

import { readJSON, writeJSON } from '../lib/storage.js';
import { PRODUCTS, sampleOrders } from './seed.js';
import { findWilaya } from './wilayas.js';
import { priceItems, buildOrder } from '../api/orderFactory.js';

const KEY = 'medina-atelier:db';
const VERSION = 1;

let cache = null;

export function createSeed(now = new Date()) {
  const products = structuredClone(PRODUCTS);
  const orders = sampleOrders(now).map((row) => {
    const w = findWilaya(row.wilaya);
    const { lines } = priceItems(products, row.items.map(([productId, variant, qty]) => ({ productId, variant, qty })));
    return buildOrder({
      number: row.number,
      createdAt: row.createdAt,
      status: row.status,
      customer: { fullName: row.name, phone: `05${String(50000000 + row.number * 1234567).slice(0, 8)}`, email: '' },
      delivery: { wilaya: w.code, wilayaName: w.name, zone: w.zone, commune: row.commune, address: row.method === 'home' ? 'Demo address' : '', method: row.method },
      lines,
    });
  });
  orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { version: VERSION, products, orders, nextOrderNumber: orders.length + 1 };
}

export function load() {
  if (cache) return cache;
  const stored = readJSON(KEY, null);
  if (stored && stored.version === VERSION && Array.isArray(stored.products)) {
    cache = stored;
  } else {
    cache = createSeed();
    persist();
  }
  return cache;
}

export function persist() {
  if (cache) writeJSON(KEY, cache);
}

export function resetDb(now) {
  cache = createSeed(now);
  persist();
  return cache;
}

/** Forget the in-memory copy (used by tests to simulate a fresh page load). */
export function dropCache() {
  cache = null;
}
