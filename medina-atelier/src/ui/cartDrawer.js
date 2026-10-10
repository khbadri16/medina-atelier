// Slide-over cart.

import { html, raw } from '../lib/html.js';
import { formatDA } from '../lib/format.js';
import { cart } from './cartStore.js';
import { productArt } from './art.js';
import { icon } from './icons.js';
import { qtyStepper } from './components.js';
import { computeTotals, FREE_SHIPPING_THRESHOLD } from '../domain/pricing.js';
import { lineKey } from '../domain/cart.js';
import * as api from '../api/index.js';

const drawer = () => document.getElementById('cart-drawer');
let lastFocus = null;

/** Lines joined with product data; lines whose product is unknown are skipped. */
export function detailedLines() {
  return cart.lines
    .map((l) => {
      const p = cart.product(l.productId);
      if (!p) return null;
      const v = p.variants?.options.find((o) => o.key === l.variant) || null;
      return {
        ...l,
        key: lineKey(l.productId, l.variant),
        product: p,
        variantName: v?.name || null,
        art: { type: p.art.type, palette: v?.palette || p.art.palette },
        unitPrice: p.price + (v?.priceDelta || 0),
      };
    })
    .filter(Boolean);
}

export async function refreshCartProducts() {
  const ids = [...new Set(cart.lines.map((l) => l.productId))];
  if (!ids.length) return;
  const products = await api.getProductsByIds(ids);
  cart.remember(products);
  // Drop lines for products that no longer exist.
  for (const l of cart.lines) if (!products.some((p) => p.id === l.productId)) cart.remove(lineKey(l.productId, l.variant));
  renderCart();
}

export function openCart() {
  const d = drawer();
  lastFocus = document.activeElement;
  d.hidden = false;
  document.documentElement.classList.add('no-scroll');
  requestAnimationFrame(() => d.classList.add('open'));
  renderCart();
  refreshCartProducts();
  setTimeout(() => d.querySelector('.drawer-close')?.focus(), 50);
}

export function closeCart() {
  const d = drawer();
  if (d.hidden) return;
  d.classList.remove('open');
  document.documentElement.classList.remove('no-scroll');
  setTimeout(() => {
    d.hidden = true;
  }, 250);
  lastFocus?.focus?.();
}

export function renderCart() {
  const d = drawer();
  if (!d || d.hidden) return;
  const lines = detailedLines();
  const totals = computeTotals({ lines, promoCode: cart.promoCode });
  const body = d.querySelector('.drawer-body');
  const foot = d.querySelector('.drawer-foot');
  d.querySelector('#cart-title').textContent = `Your cart${cart.count ? ` (${cart.count})` : ''}`;

  if (!cart.lines.length) {
    body.innerHTML = String(html`<div class="cart-empty">
      <span class="empty-icon">${raw(icon('bag'))}</span>
      <p>Your cart is empty.</p>
      <a class="btn btn-ghost" href="#/shop" data-close>Browse the collection</a>
    </div>`);
    foot.hidden = true;
    return;
  }

  body.innerHTML = String(html`<ul class="cart-lines">${lines.map((l) => html`
    <li class="cart-line">
      <a class="cl-art" href="#/product/${l.product.slug}" data-close>${raw(productArt(l.art))}</a>
      <div class="cl-info">
        <a class="cl-name" href="#/product/${l.product.slug}" data-close>${l.product.name}</a>
        ${l.variantName ? html`<span class="cl-variant">${l.product.variants.label}: ${l.variantName}</span>` : ''}
        <span class="cl-price">${formatDA(l.unitPrice)}</span>
        <div class="cl-actions">
          ${qtyStepper(l.qty, { max: Math.min(10, l.product.stock - (cart.inCart(l.productId) - l.qty)), key: l.key })}
          <button type="button" class="link-btn" data-remove="${l.key}">${raw(icon('trash'))} Remove</button>
        </div>
      </div>
      <span class="cl-total">${formatDA(l.unitPrice * l.qty)}</span>
    </li>`)}</ul>`);

  const pct = Math.min(100, (totals.subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  foot.hidden = false;
  foot.innerHTML = String(html`
    <div class="ship-progress">
      <p>${totals.freeShipping ? html`${raw(icon('truck'))} You've unlocked <b>free delivery</b>.` : html`Add <b>${formatDA(totals.freeShippingRemaining)}</b> more for free delivery.`}</p>
      <div class="bar"><span style="width:${pct}%"></span></div>
    </div>
    ${totals.promo
      ? html`<div class="promo-applied">${raw(icon('tag'))}<span><b>${totals.promo.code}</b> · ${totals.promo.label}</span><button type="button" class="link-btn" data-promo-remove>Remove</button></div>`
      : html`<form class="promo-form" data-promo>
          <label class="sr-only" for="promo-input">Promo code</label>
          <input id="promo-input" name="code" placeholder="Promo code" autocomplete="off" value="${cart.promoCode}">
          <button type="submit" class="btn btn-ghost btn-sm">Apply</button>
        </form>
        ${totals.promoError ? html`<p class="field-error">${totals.promoError}</p>` : ''}`}
    <dl class="totals">
      <div><dt>Subtotal</dt><dd>${formatDA(totals.subtotal)}</dd></div>
      ${totals.discount ? html`<div class="is-discount"><dt>Discount</dt><dd>−${formatDA(totals.discount)}</dd></div>` : ''}
      <div><dt>Delivery</dt><dd>${totals.freeShipping ? 'Free' : 'Calculated at checkout'}</dd></div>
      <div class="is-total"><dt>Total</dt><dd>${formatDA(totals.total)}</dd></div>
    </dl>
    <a class="btn btn-primary btn-block" href="#/checkout" data-close>Checkout ${raw(icon('arrowRight'))}</a>
    <p class="cart-note">${raw(icon('cash'))} Pay in cash when your order arrives.</p>`);
}

export function initCartDrawer() {
  const d = drawer();
  d.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]') || e.target.classList.contains('drawer-backdrop')) closeCart();
    const rm = e.target.closest('[data-remove]');
    if (rm) cart.remove(rm.dataset.remove);
    const step = e.target.closest('.qty-btn');
    if (step) {
      const wrap = step.closest('.qty');
      const input = wrap.querySelector('input');
      cart.setQty(wrap.dataset.key, Number(input.value) + Number(step.dataset.step));
    }
    if (e.target.closest('[data-promo-remove]')) cart.setPromo('');
  });
  d.addEventListener('change', (e) => {
    if (e.target.classList.contains('qty-input')) cart.setQty(e.target.closest('.qty').dataset.key, Number(e.target.value));
  });
  d.addEventListener('submit', (e) => {
    if (!e.target.matches('[data-promo]')) return;
    e.preventDefault();
    cart.setPromo(new FormData(e.target).get('code').trim().toUpperCase());
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeCart();
    if (e.key === 'Tab' && !d.hidden) {
      // Keep keyboard focus inside the open drawer.
      const focusable = [...d.querySelectorAll('a[href], button:not([disabled]), input, [tabindex="0"]')];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
  cart.subscribe(renderCart);
}
