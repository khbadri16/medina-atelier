import test from 'node:test';
import assert from 'node:assert/strict';
import { computeTotals, checkPromo, FREE_SHIPPING_THRESHOLD } from '../src/domain/pricing.js';
import { addLine, setLineQty, removeLine, cartCount, lineKey } from '../src/domain/cart.js';
import { validateCheckout, normalizePhone } from '../src/domain/validation.js';
import { canTransition } from '../src/domain/orders.js';
import { escapeHtml, html } from '../src/lib/html.js';

/* Pricing */

test('totals without promo or delivery choice', () => {
  const t = computeTotals({ lines: [{ unitPrice: 3500, qty: 2 }, { unitPrice: 1200, qty: 1 }] });
  assert.equal(t.subtotal, 8200);
  assert.equal(t.discount, 0);
  assert.equal(t.shipping, null);
  assert.equal(t.total, 8200);
});

test('percent promo and zone-based delivery fee', () => {
  const t = computeTotals({ lines: [{ unitPrice: 5000, qty: 1 }], promoCode: ' bienvenue10 ', zone: 2, method: 'home' });
  assert.equal(t.discount, 500);
  assert.equal(t.shipping, 600);
  assert.equal(t.total, 5000 - 500 + 600);
});

test('free delivery from the threshold', () => {
  const t = computeTotals({ lines: [{ unitPrice: FREE_SHIPPING_THRESHOLD, qty: 1 }], zone: 4, method: 'home' });
  assert.equal(t.shipping, 0);
  assert.equal(t.freeShippingRemaining, 0);
});

test('fixed promo needs a minimum subtotal', () => {
  assert.match(checkPromo('ATELIER2000', 10000).error, /at least/);
  assert.equal(checkPromo('ATELIER2000', 25000).promo.value, 2000);
  assert.match(checkPromo('NOPE', 25000).error, /does not exist/);
});

/* Cart */

test('adding the same variant merges lines; different variants do not', () => {
  let { lines } = addLine([], { productId: 'p03', variant: 'cobalt', qty: 1 }, 10);
  ({ lines } = addLine(lines, { productId: 'p03', variant: 'cobalt', qty: 2 }, 10));
  ({ lines } = addLine(lines, { productId: 'p03', variant: 'olive', qty: 1 }, 10));
  assert.equal(lines.length, 2);
  assert.equal(cartCount(lines), 4);
});

test('stock caps the total across variants of a product', () => {
  let { lines, added } = addLine([], { productId: 'p05', variant: 's', qty: 2 }, 3);
  assert.equal(added, 2);
  ({ lines, added } = addLine(lines, { productId: 'p05', variant: 'm', qty: 5 }, 3));
  assert.equal(added, 1);
  assert.equal(cartCount(lines), 3);
  const after = setLineQty(lines, lineKey('p05', 's'), 9, 3);
  assert.equal(cartCount(after), 3, 'cannot exceed stock by editing a line');
});

test('setting quantity to 0 removes the line', () => {
  const { lines } = addLine([], { productId: 'p15', qty: 2 }, 50);
  assert.equal(setLineQty(lines, 'p15', 0, 50).length, 0);
  assert.equal(removeLine(lines, 'p15').length, 0);
});

/* Validation */

test('phone numbers are normalised', () => {
  assert.equal(normalizePhone('+213 5 55 12 34 56'), '0555123456');
  assert.equal(normalizePhone('00213661234567'), '0661234567');
  assert.equal(normalizePhone('0770 12 34 56'), '0770123456');
});

const goodForm = { fullName: 'Amina Benali', phone: '0555 12 34 56', wilaya: '23', commune: 'El Bouni', address: '12 rue des Jardins', method: 'home' };

test('a complete form is valid', () => {
  const r = validateCheckout(goodForm);
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.value.phone, '0555123456');
});

test('invalid fields are reported individually', () => {
  const r = validateCheckout({ fullName: 'A', phone: '0212345678', email: 'x@', wilaya: '99', commune: '', method: 'home', address: '' });
  assert.deepEqual(Object.keys(r.errors).sort(), ['address', 'commune', 'email', 'fullName', 'phone', 'wilaya']);
});

test('stop-desk delivery does not need a street address', () => {
  assert.equal(validateCheckout({ ...goodForm, method: 'desk', address: '' }).ok, true);
});

/* Orders */

test('order status transitions follow the lifecycle', () => {
  assert.ok(canTransition('pending', 'confirmed'));
  assert.ok(canTransition('confirmed', 'cancelled'));
  assert.ok(!canTransition('shipped', 'cancelled'));
  assert.ok(!canTransition('delivered', 'pending'));
});

/* Templating */

test('templates escape interpolated values', () => {
  assert.equal(escapeHtml('<img onerror=x>'), '&lt;img onerror=x&gt;');
  const name = '<script>alert(1)</script>';
  assert.equal(String(html`<p>${name}</p>`), '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
  assert.equal(String(html`<ul>${['a', 'b'].map((x) => html`<li>${x}</li>`)}</ul>`), '<ul><li>a</li><li>b</li></ul>');
});
