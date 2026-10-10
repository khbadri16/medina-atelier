// The store's API.
//
// The UI only ever talks to these async functions, never to storage directly.
// They behave like HTTP endpoints: they add network-like latency, validate
// every input, recompute prices from the catalogue, return copies (so the UI
// can't mutate the "database"), and throw ApiError with a status code.
// Replacing this module with fetch() calls to a real backend
// (GET /products, POST /orders, ...) would not change any UI code.

import { load, persist, resetDb } from '../data/db.js';
import { CATEGORIES } from '../data/seed.js';
import { findWilaya } from '../data/wilayas.js';
import { validateCheckout } from '../domain/validation.js';
import { checkPromo, computeTotals } from '../domain/pricing.js';
import { canTransition, restocksOn } from '../domain/orders.js';
import { priceItems, buildOrder } from './orderFactory.js';

export class ApiError extends Error {
  constructor(message, { status = 400, fields = null, details = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fields = fields;
    this.details = details;
  }
}

let latency = [120, 320];
/** Simulated network latency in ms ([0, 0] in tests). */
export function setLatency(min, max = min) {
  latency = [min, max];
}
function network() {
  const [min, max] = latency;
  const ms = min + Math.random() * (max - min);
  return ms > 0 ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve();
}
const copy = (v) => structuredClone(v);

/* ---------------- Catalogue ---------------- */

function fold(s) {
  return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function matches(product, q) {
  if (!q) return true;
  const cat = CATEGORIES.find((c) => c.id === product.category);
  const hay = fold([product.name, product.description, product.material, product.origin, cat?.name].join(' '));
  return fold(q).split(/\s+/).filter(Boolean).every((word) => hay.includes(word));
}

const SORTS = {
  featured: (a, b) => Number(b.featured) - Number(a.featured) || b.reviews - a.reviews,
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  rating: (a, b) => b.rating - a.rating || b.reviews - a.reviews,
};

/** GET /products?q=&category=&min=&max=&inStock=&sort= */
export async function listProducts({ q = '', category = '', min = null, max = null, inStock = false, sort = 'featured' } = {}) {
  await network();
  const { products } = load();
  const active = products.filter((p) => p.active);
  const searched = active.filter((p) => matches(p, q));

  const facets = CATEGORIES.map((c) => ({ ...c, count: searched.filter((p) => p.category === c.id).length }));
  const items = searched
    .filter((p) => !category || p.category === category)
    .filter((p) => min == null || p.price >= min)
    .filter((p) => max == null || p.price <= max)
    .filter((p) => !inStock || p.stock > 0)
    .sort(SORTS[sort] || SORTS.featured);

  const prices = active.map((p) => p.price);
  return copy({
    items,
    total: items.length,
    facets,
    priceBounds: { min: Math.min(...prices), max: Math.max(...prices) },
  });
}

/** GET /products/:slug */
export async function getProduct(slug) {
  await network();
  const { products } = load();
  const product = products.find((p) => p.slug === slug && p.active);
  if (!product) throw new ApiError('Product not found.', { status: 404 });
  const related = products
    .filter((p) => p.active && p.id !== product.id && p.category === product.category)
    .concat(products.filter((p) => p.active && p.featured && p.category !== product.category))
    .slice(0, 4);
  return copy({ product, related });
}

/** GET /products?ids= — used to show the cart with fresh prices and stock. */
export async function getProductsByIds(ids) {
  await network();
  const { products } = load();
  return copy(products.filter((p) => ids.includes(p.id)));
}

export async function listCategories() {
  await network();
  return copy(CATEGORIES);
}

/* ---------------- Orders ---------------- */

/**
 * POST /orders
 * @param {{ customer: object, items: {productId:string, variant:string|null, qty:number}[], promoCode?: string }} payload
 */
export async function placeOrder(payload) {
  await network();
  const db = load();

  const check = validateCheckout(payload.customer || {});
  if (!check.ok) throw new ApiError('Please fix the highlighted fields.', { status: 422, fields: check.errors });

  const items = Array.isArray(payload.items) ? payload.items : [];
  if (!items.length) throw new ApiError('Your cart is empty.', { status: 422 });

  const { lines, problems } = priceItems(db.products, items);
  if (problems.length) {
    throw new ApiError('Some items in your cart are no longer available.', { status: 409, details: problems });
  }

  // Stock check across all lines of the same product.
  const wanted = new Map();
  for (const l of lines) wanted.set(l.productId, (wanted.get(l.productId) || 0) + l.qty);
  const shortages = [];
  for (const [productId, qty] of wanted) {
    const product = db.products.find((p) => p.id === productId);
    if (product.stock < qty) shortages.push({ productId, name: product.name, available: product.stock, requested: qty });
  }
  if (shortages.length) {
    throw new ApiError('Not enough stock for some items.', { status: 409, details: shortages });
  }

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  if (payload.promoCode) {
    const { error } = checkPromo(payload.promoCode, subtotal);
    if (error) throw new ApiError(error, { status: 422, fields: { promoCode: error } });
  }

  const c = check.value;
  const w = findWilaya(c.wilaya);
  const now = new Date().toISOString();
  const order = buildOrder({
    number: db.nextOrderNumber,
    createdAt: now,
    customer: { fullName: c.fullName, phone: c.phone, email: c.email },
    delivery: { wilaya: w.code, wilayaName: w.name, zone: w.zone, commune: c.commune, address: c.method === 'home' ? c.address : '', method: c.method },
    lines,
    promoCode: payload.promoCode,
    notes: c.notes,
  });

  // Commit: decrement stock and save, as one unit of work.
  for (const [productId, qty] of wanted) db.products.find((p) => p.id === productId).stock -= qty;
  db.orders.unshift(order);
  db.nextOrderNumber++;
  persist();
  return copy(order);
}

/** GET /orders/:id */
export async function getOrder(id) {
  await network();
  const order = load().orders.find((o) => o.id === id);
  if (!order) throw new ApiError('Order not found.', { status: 404 });
  return copy(order);
}

/** GET /orders?ids= — the customer's own orders. */
export async function getOrders(ids) {
  await network();
  return copy(load().orders.filter((o) => ids.includes(o.id)));
}

/** Preview totals for the checkout summary (same rules as placeOrder). */
export function quote(lines, { promoCode, wilaya, method }) {
  const w = findWilaya(wilaya);
  return computeTotals({ lines, promoCode, zone: w?.zone, method });
}

/* ---------------- Admin ---------------- */

export async function adminListOrders({ status = '' } = {}) {
  await network();
  const { orders } = load();
  return copy(status ? orders.filter((o) => o.status === status) : orders);
}

/** PATCH /admin/orders/:id { status } */
export async function adminUpdateOrderStatus(id, status) {
  await network();
  const db = load();
  const order = db.orders.find((o) => o.id === id);
  if (!order) throw new ApiError('Order not found.', { status: 404 });
  if (!canTransition(order.status, status)) {
    throw new ApiError(`An order that is ${order.status} cannot become ${status}.`, { status: 409 });
  }
  if (restocksOn(status)) {
    for (const item of order.items) {
      const product = db.products.find((p) => p.id === item.productId);
      if (product) product.stock += item.qty;
    }
  }
  order.status = status;
  order.history.push({ status, at: new Date().toISOString() });
  persist();
  return copy(order);
}

/** PATCH /admin/products/:id { price?, stock?, active? } */
export async function adminUpdateProduct(id, patch) {
  await network();
  const db = load();
  const product = db.products.find((p) => p.id === id);
  if (!product) throw new ApiError('Product not found.', { status: 404 });
  const fields = {};
  if ('price' in patch) {
    const v = Number(patch.price);
    if (!Number.isInteger(v) || v < 100 || v > 1_000_000) fields.price = 'Price must be a whole number between 100 and 1 000 000 DA.';
  }
  if ('stock' in patch) {
    const v = Number(patch.stock);
    if (!Number.isInteger(v) || v < 0 || v > 9999) fields.stock = 'Stock must be a whole number between 0 and 9 999.';
  }
  if (Object.keys(fields).length) throw new ApiError('Invalid product update.', { status: 422, fields });
  if ('price' in patch) product.price = Number(patch.price);
  if ('stock' in patch) product.stock = Number(patch.stock);
  if ('active' in patch) product.active = Boolean(patch.active);
  persist();
  return copy(product);
}

/** GET /admin/stats */
export async function adminStats(now = new Date()) {
  await network();
  const { orders, products } = load();
  const valid = orders.filter((o) => o.status !== 'cancelled');
  const revenue = valid.reduce((s, o) => s + o.totals.total, 0);

  const byCategory = CATEGORIES.map((c) => ({
    id: c.id,
    name: c.name,
    revenue: valid.flatMap((o) => o.items).filter((i) => i.category === c.id).reduce((s, i) => s + i.lineTotal, 0),
  })).sort((a, b) => b.revenue - a.revenue);

  const days = [];
  for (let d = 13; d >= 0; d--) {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - d);
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    const dayOrders = valid.filter((o) => {
      const t = new Date(o.createdAt);
      return t >= date && t < next;
    });
    days.push({ date: date.toISOString(), revenue: dayOrders.reduce((s, o) => s + o.totals.total, 0), orders: dayOrders.length });
  }

  return copy({
    revenue,
    orders: valid.length,
    averageOrder: valid.length ? Math.round(revenue / valid.length) : 0,
    pending: orders.filter((o) => o.status === 'pending').length,
    lowStock: products.filter((p) => p.active && p.stock <= 3).map((p) => ({ id: p.id, name: p.name, stock: p.stock })),
    byCategory,
    days,
    recent: orders.slice(0, 5),
  });
}

export async function adminListProducts() {
  await network();
  return copy(load().products);
}

export async function adminResetDemo() {
  await network();
  resetDb();
}
