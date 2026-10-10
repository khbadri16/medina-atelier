// Builds order records from catalogue data. Used by the API when a customer
// checks out and by the seed when creating demo orders.

import { computeTotals } from '../domain/pricing.js';
import { STATUS_FLOW } from '../domain/orders.js';

/**
 * Turn requested items into priced lines using catalogue prices (never the
 * client's). Returns the lines plus any problems found.
 */
export function priceItems(products, items) {
  const lines = [];
  const problems = [];
  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product || !product.active) {
      problems.push({ productId: item.productId, reason: 'unavailable' });
      continue;
    }
    let variant = null;
    if (product.variants) {
      variant = product.variants.options.find((o) => o.key === item.variant) || null;
      if (!variant) {
        problems.push({ productId: product.id, reason: 'variant' });
        continue;
      }
    }
    const qty = Math.floor(Number(item.qty));
    if (!(qty >= 1)) {
      problems.push({ productId: product.id, reason: 'quantity' });
      continue;
    }
    const unitPrice = product.price + (variant ? variant.priceDelta : 0);
    lines.push({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      category: product.category,
      variant: variant ? variant.key : null,
      variantName: variant ? variant.name : null,
      variantLabel: product.variants ? product.variants.label : null,
      art: { type: product.art.type, palette: variant?.palette || product.art.palette },
      unitPrice,
      qty,
      lineTotal: unitPrice * qty,
    });
  }
  return { lines, problems };
}

export function formatOrderNumber(n, date) {
  return `MA-${new Date(date).getFullYear()}-${String(n).padStart(5, '0')}`;
}

export function newId(prefix) {
  const rand = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
    : Math.random().toString(36).slice(2, 14);
  return `${prefix}_${rand}`;
}

export function buildOrder({ number, createdAt, status = 'pending', customer, delivery, lines, promoCode = '', notes = '' }) {
  const totals = computeTotals({ lines, promoCode, zone: delivery.zone, method: delivery.method });

  // History: every step of the normal flow up to the current status.
  const history = [];
  const start = new Date(createdAt).getTime();
  const reached = status === 'cancelled' ? ['pending', 'cancelled'] : STATUS_FLOW.slice(0, STATUS_FLOW.indexOf(status) + 1);
  reached.forEach((s, i) => history.push({ status: s, at: new Date(start + i * 18 * 3600e3).toISOString() }));

  return {
    id: newId('ord'),
    number: formatOrderNumber(number, createdAt),
    createdAt,
    status,
    history,
    customer,
    delivery,
    items: lines,
    totals: {
      subtotal: totals.subtotal,
      discount: totals.discount,
      shipping: totals.shipping ?? 0,
      total: totals.total,
    },
    promoCode: totals.promo ? totals.promo.code : '',
    notes,
  };
}
