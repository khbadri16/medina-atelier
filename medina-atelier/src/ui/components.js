// Reusable view fragments.

import { html, raw } from '../lib/html.js';
import { formatDA } from '../lib/format.js';
import { productArt } from './art.js';
import { icon } from './icons.js';
import { CATEGORIES } from '../data/seed.js';
import { STATUS_LABEL } from '../domain/orders.js';

export const categoryName = (id) => CATEGORIES.find((c) => c.id === id)?.name || id;

export function stars(rating, reviews) {
  const full = Math.round(rating * 2) / 2;
  let s = '';
  for (let i = 1; i <= 5; i++) {
    const fill = full >= i ? 1 : full >= i - 0.5 ? 0.5 : 0;
    s += `<span class="star" style="--f:${fill}"></span>`;
  }
  return html`<span class="stars" aria-label="Rated ${rating} out of 5${reviews != null ? `, ${reviews} reviews` : ''}">${raw(s)}${reviews != null ? html`<span class="stars-count">${rating.toFixed(1)} (${reviews})</span>` : ''}</span>`;
}

export function priceTag(price, compareAt) {
  return html`<span class="price">
    <span class="price-now">${formatDA(price)}</span>
    ${compareAt ? html`<s class="price-was">${formatDA(compareAt)}</s>` : ''}
  </span>`;
}

export function stockNote(stock) {
  if (stock <= 0) return html`<span class="stock stock-out">Sold out</span>`;
  if (stock <= 3) return html`<span class="stock stock-low">Only ${stock} left</span>`;
  return html`<span class="stock stock-in">In stock</span>`;
}

export function productCard(p) {
  const soldOut = p.stock <= 0;
  const action = soldOut
    ? html`<span class="pc-action pc-soldout">Sold out</span>`
    : p.variants
      ? html`<a class="pc-action" href="#/product/${p.slug}">Choose ${p.variants.label.toLowerCase()} ${raw(icon('arrowRight'))}</a>`
      : html`<button type="button" class="pc-action" data-add="${p.id}">${raw(icon('plus'))} Add to cart</button>`;
  return html`<article class="product-card ${soldOut ? 'is-soldout' : ''}">
    <a class="pc-media" href="#/product/${p.slug}" tabindex="-1" aria-hidden="true">
      ${raw(productArt(p.art))}
      ${p.badge ? html`<span class="pc-badge">${p.badge}</span>` : ''}
      ${p.variants && p.variants.options.some((o) => o.palette !== p.variants.options[0].palette)
        ? html`<span class="pc-swatches">${p.variants.options.map((o) => html`<i class="sw sw-${o.palette}"></i>`)}</span>` : ''}
    </a>
    <div class="pc-body">
      <p class="pc-cat">${categoryName(p.category)} · ${p.origin}</p>
      <h3 class="pc-title"><a href="#/product/${p.slug}">${p.name}</a></h3>
      ${stars(p.rating, p.reviews)}
      <div class="pc-foot">${priceTag(p.price, p.compareAt)}</div>
    </div>
    ${action}
  </article>`;
}

export function productGrid(products, { cols = 0 } = {}) {
  return html`<div class="product-grid ${cols === 4 ? 'grid-4' : ''}">${products.map(productCard)}</div>`;
}

export function skeletonGrid(n = 8) {
  return html`<div class="product-grid ${n === 4 ? 'grid-4' : ''}" aria-busy="true">${Array.from({ length: n }, () => html`<div class="product-card skeleton"><div class="pc-media"></div><div class="pc-body"><span></span><span></span><span></span></div></div>`)}</div>`;
}

export function qtyStepper(value, { max = 10, key = '', label = 'Quantity' } = {}) {
  return html`<div class="qty" data-key="${key}">
    <button type="button" class="qty-btn" data-step="-1" aria-label="Decrease ${label.toLowerCase()}" ${value <= 1 && !key ? 'disabled' : ''}>${raw(icon('minus'))}</button>
    <input class="qty-input" type="number" inputmode="numeric" min="${key ? 0 : 1}" max="${max}" value="${value}" aria-label="${label}">
    <button type="button" class="qty-btn" data-step="1" aria-label="Increase ${label.toLowerCase()}" ${value >= max ? 'disabled' : ''}>${raw(icon('plus'))}</button>
  </div>`;
}

export function statusBadge(status) {
  return html`<span class="status status-${status}">${STATUS_LABEL[status] || status}</span>`;
}

export function emptyState({ title, text, cta, href = '#/shop', iconName = 'bag' }) {
  return html`<div class="empty">
    <span class="empty-icon">${raw(icon(iconName))}</span>
    <h2>${title}</h2>
    <p>${text}</p>
    ${cta ? html`<a class="btn btn-primary" href="${href}">${cta}</a>` : ''}
  </div>`;
}

export function errorState(err) {
  return emptyState({ title: err.status === 404 ? 'Not found' : 'Something went wrong', text: err.message || 'Please try again.', cta: 'Back to the shop', iconName: 'alert' });
}
