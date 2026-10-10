import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { setStorage, memoryStorage } from '../src/lib/storage.js';
import { dropCache, resetDb } from '../src/data/db.js';
import * as api from '../src/api/index.js';

const customer = { fullName: 'Karim Haddad', phone: '0661 23 45 67', wilaya: 25, commune: 'El Khroub', address: '5 cité des Oliviers', method: 'home' };

beforeEach(() => {
  setStorage(memoryStorage());
  dropCache();
  resetDb();
  api.setLatency(0);
});

test('search, filter and sort the catalogue', async () => {
  const all = await api.listProducts();
  assert.ok(all.total >= 16);
  const copper = await api.listProducts({ category: 'copper', sort: 'price-asc' });
  assert.ok(copper.items.every((p) => p.category === 'copper'));
  assert.deepEqual(copper.items.map((p) => p.price), [...copper.items.map((p) => p.price)].sort((a, b) => a - b));
  const olive = await api.listProducts({ q: 'OLIVE wood' });
  assert.ok(olive.items.length >= 2 && olive.items.every((p) => /olive/i.test(p.name + p.material)));
  const accent = await api.listProducts({ q: 'bejaia' });
  assert.ok(accent.items.some((p) => p.origin === 'Béjaïa'), 'search ignores accents');
  const inStock = await api.listProducts({ inStock: true });
  assert.ok(inStock.items.every((p) => p.stock > 0));
});

test('placing an order recomputes prices server-side and decrements stock', async () => {
  const { product } = await api.getProduct('glazed-serving-bowl');
  const order = await api.placeOrder({
    customer,
    items: [{ productId: product.id, variant: 'olive', qty: 2, unitPrice: 1 }], // forged price is ignored
  });
  assert.equal(order.items[0].unitPrice, product.price);
  assert.equal(order.totals.subtotal, product.price * 2);
  assert.equal(order.status, 'pending');
  assert.match(order.number, /^MA-\d{4}-\d{5}$/);
  const after = await api.getProduct('glazed-serving-bowl');
  assert.equal(after.product.stock, product.stock - 2);
});

test('orders beyond available stock are rejected without side effects', async () => {
  const { product } = await api.getProduct('beeswax-pillar-candle'); // stock 2
  await assert.rejects(
    api.placeOrder({ customer, items: [{ productId: product.id, variant: null, qty: 3 }] }),
    (err) => err.status === 409 && err.details[0].available === 2,
  );
  assert.equal((await api.getProduct('beeswax-pillar-candle')).product.stock, 2);
});

test('invalid checkout data returns field errors', async () => {
  await assert.rejects(
    api.placeOrder({ customer: { ...customer, phone: '123' }, items: [{ productId: 'p15', qty: 1 }] }),
    (err) => err.status === 422 && 'phone' in err.fields,
  );
});

test('an invalid promo code is refused', async () => {
  await assert.rejects(
    api.placeOrder({ customer, items: [{ productId: 'p15', qty: 1 }], promoCode: 'ATELIER2000' }),
    (err) => err.status === 422 && 'promoCode' in err.fields,
  );
});

test('cancelling an order restocks; illegal transitions are refused', async () => {
  const order = await api.placeOrder({ customer, items: [{ productId: 'p11', qty: 2 }] });
  const before = (await api.getProduct('olive-wood-serving-board')).product.stock;
  await api.adminUpdateOrderStatus(order.id, 'cancelled');
  assert.equal((await api.getProduct('olive-wood-serving-board')).product.stock, before + 2);
  await assert.rejects(api.adminUpdateOrderStatus(order.id, 'shipped'), (err) => err.status === 409);
});

test('data persists across page loads', async () => {
  const order = await api.placeOrder({ customer, items: [{ productId: 'p15', qty: 1 }] });
  dropCache(); // simulate a reload: the in-memory copy is gone, storage remains
  const again = await api.getOrder(order.id);
  assert.equal(again.number, order.number);
});

test('the API returns copies, not live references', async () => {
  const { product } = await api.getProduct('leather-satchel');
  product.price = 1;
  assert.notEqual((await api.getProduct('leather-satchel')).product.price, 1);
});

test('admin stats exclude cancelled orders', async () => {
  const stats = await api.adminStats();
  const orders = await api.adminListOrders();
  const expected = orders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.totals.total, 0);
  assert.equal(stats.revenue, expected);
  assert.ok(stats.lowStock.some((p) => p.stock === 0));
});

test('admin product updates are validated', async () => {
  await assert.rejects(api.adminUpdateProduct('p01', { price: -5 }), (err) => err.status === 422);
  const p = await api.adminUpdateProduct('p01', { price: 7200, stock: 3 });
  assert.equal(p.price, 7200);
  assert.equal(p.stock, 3);
});
