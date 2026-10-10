// Cart operations as pure functions over an array of lines.
// A line is { productId, variant, qty }; the same product in two variants
// is two lines. Quantities are clamped to the available stock.

export const MAX_QTY_PER_LINE = 10;

export function lineKey(productId, variant) {
  return variant ? `${productId}:${variant}` : String(productId);
}

function clampQty(qty, max) {
  const limit = Math.min(MAX_QTY_PER_LINE, max ?? MAX_QTY_PER_LINE);
  return Math.max(0, Math.min(limit, Math.floor(Number(qty) || 0)));
}

/** Units of a product already in the cart, across all its variants. */
export function qtyOfProduct(lines, productId) {
  return lines.filter((l) => l.productId === productId).reduce((s, l) => s + l.qty, 0);
}

/**
 * Add qty of a product variant. `stock` caps the total across the product's
 * variants. Returns { lines, added } where `added` may be less than requested.
 */
export function addLine(lines, { productId, variant = null, qty = 1 }, stock = Infinity) {
  const key = lineKey(productId, variant);
  const existing = lines.find((l) => lineKey(l.productId, l.variant) === key);
  const room = Math.max(0, stock - qtyOfProduct(lines, productId));
  const current = existing ? existing.qty : 0;
  const target = clampQty(current + Math.min(qty, room), Infinity);
  const added = target - current;
  if (added <= 0) return { lines, added: 0 };
  const next = existing
    ? lines.map((l) => (l === existing ? { ...l, qty: target } : l))
    : [...lines, { productId, variant, qty: target }];
  return { lines: next, added };
}

/** Set the quantity of one line; 0 removes it. */
export function setLineQty(lines, key, qty, stock = Infinity) {
  const line = lines.find((l) => lineKey(l.productId, l.variant) === key);
  if (!line) return lines;
  const others = qtyOfProduct(lines, line.productId) - line.qty;
  const value = clampQty(qty, Math.max(0, stock - others));
  if (value === 0) return removeLine(lines, key);
  return lines.map((l) => (l === line ? { ...l, qty: value } : l));
}

export function removeLine(lines, key) {
  return lines.filter((l) => lineKey(l.productId, l.variant) !== key);
}

export function cartCount(lines) {
  return lines.reduce((s, l) => s + l.qty, 0);
}
