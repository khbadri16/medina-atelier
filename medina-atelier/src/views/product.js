import { html, raw } from '../lib/html.js';
import * as api from '../api/index.js';
import { formatDA } from '../lib/format.js';
import { productArt } from '../ui/art.js';
import { icon } from '../ui/icons.js';
import { stars, stockNote, qtyStepper, productGrid, errorState, categoryName } from '../ui/components.js';
import { cart } from '../ui/cartStore.js';
import { toast } from '../ui/toast.js';
import { openCart } from '../ui/cartDrawer.js';
import { FREE_SHIPPING_THRESHOLD } from '../domain/pricing.js';
import { MAX_QTY_PER_LINE } from '../domain/cart.js';

export default {
  title: 'Product',
  async render({ el, params, isCurrent }) {
    el.innerHTML = '<div class="container page"><div class="pdp skeleton-pdp"><div class="pdp-media"></div><div class="pdp-info"><span></span><span></span><span></span></div></div></div>';
    let data;
    try {
      data = await api.getProduct(params[0]);
    } catch (err) {
      if (isCurrent()) el.innerHTML = `<div class="container page">${errorState(err)}</div>`;
      return;
    }
    if (!isCurrent()) return;
    const { product: p, related } = data;
    cart.remember([p, ...related]);
    document.title = `${p.name} · Medina Atelier`;

    const state = { variant: p.variants ? p.variants.options[0].key : null, qty: 1 };
    const variantOf = () => p.variants?.options.find((o) => o.key === state.variant) || null;
    const unitPrice = () => p.price + (variantOf()?.priceDelta || 0);
    const room = () => Math.max(0, Math.min(MAX_QTY_PER_LINE, p.stock - cart.inCart(p.id)));
    const discount = p.compareAt ? Math.round((1 - p.price / p.compareAt) * 100) : 0;
    const colourVariants = !!p.variants?.options.some((o) => o.palette !== p.variants.options[0].palette);

    el.innerHTML = String(html`
      <div class="container page">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a href="#/shop">Shop</a><span>/</span>
          <a href="#/shop?category=${p.category}">${categoryName(p.category)}</a><span>/</span>
          <span aria-current="page">${p.name}</span>
        </nav>
        <div class="pdp">
          <div class="pdp-media">
            <div class="pdp-art" id="pdp-art"></div>
            ${p.badge ? html`<span class="pc-badge">${p.badge}</span>` : ''}
          </div>
          <div class="pdp-info">
            <p class="eyebrow">${categoryName(p.category)} · Made in ${p.origin}</p>
            <h1>${p.name}</h1>
            ${stars(p.rating, p.reviews)}
            <div class="pdp-price">
              <span class="price-now" id="pdp-price">${formatDA(unitPrice())}</span>
              ${p.compareAt ? html`<s class="price-was">${formatDA(p.compareAt)}</s><span class="save">−${discount}%</span>` : ''}
            </div>
            <p class="pdp-desc">${p.description}</p>

            ${p.variants ? html`<fieldset class="variants">
              <legend>${p.variants.label}: <b id="variant-name">${variantOf().name}</b></legend>
              <div class="variant-list">
                ${p.variants.options.map((o, i) => html`<label class="variant">
                  <input type="radio" name="variant" value="${o.key}" ${i === 0 ? 'checked' : ''}>
                  <span>${colourVariants ? html`<i class="sw sw-${o.palette}"></i>` : ''}${o.name}${o.priceDelta ? html` <small>+${formatDA(o.priceDelta)}</small>` : ''}</span>
                </label>`)}
              </div>
            </fieldset>` : ''}

            <div class="buy">
              <div id="stepper"></div>
              <button type="button" class="btn btn-primary btn-lg" id="add">${raw(icon('bag'))} <span>Add to cart</span></button>
            </div>
            <p class="buy-note" id="buy-note"></p>

            <ul class="assurances">
              <li>${raw(icon('cash'))} Cash on delivery: pay when it arrives</li>
              <li>${raw(icon('truck'))} Free delivery on orders over ${formatDA(FREE_SHIPPING_THRESHOLD)}</li>
              <li>${raw(icon('refresh'))} 14-day returns</li>
            </ul>

            <dl class="specs">
              <div><dt>Material</dt><dd>${p.material}</dd></div>
              <div><dt>Dimensions</dt><dd>${p.dimensions}</dd></div>
              <div><dt>Made in</dt><dd>${p.origin}, Algeria</dd></div>
              <div><dt>Care</dt><dd>${p.care}</dd></div>
            </dl>
          </div>
        </div>

        ${related.length ? html`<section class="section">
          <header class="section-head"><div><p class="eyebrow">You may also like</p><h2>More from the atelier</h2></div></header>
          ${productGrid(related)}
        </section>` : ''}
      </div>`);

    const art = el.querySelector('#pdp-art');
    const addBtn = el.querySelector('#add');
    const note = el.querySelector('#buy-note');

    function refresh() {
      const v = variantOf();
      art.innerHTML = productArt({ type: p.art.type, palette: v?.palette || p.art.palette }, { label: `${p.name}${v ? `, ${v.name}` : ''}` });
      el.querySelector('#pdp-price').textContent = formatDA(unitPrice());
      if (v) el.querySelector('#variant-name').textContent = v.name;
      const max = room();
      state.qty = Math.max(1, Math.min(state.qty, max || 1));
      el.querySelector('#stepper').innerHTML = String(qtyStepper(state.qty, { max: Math.max(1, max) }));
      const inCart = cart.inCart(p.id);
      addBtn.disabled = max === 0;
      addBtn.querySelector('span').textContent = p.stock <= 0 ? 'Sold out' : max === 0 ? 'All available units are in your cart' : 'Add to cart';
      note.innerHTML = String(html`${stockNote(p.stock)}${inCart ? html` · ${inCart} in your cart` : ''}`);
    }
    refresh();

    el.querySelectorAll('input[name="variant"]').forEach((r) => r.addEventListener('change', () => {
      state.variant = r.value;
      refresh();
    }));
    el.querySelector('#stepper').addEventListener('click', (e) => {
      const b = e.target.closest('.qty-btn');
      if (!b) return;
      state.qty = Math.max(1, Math.min(room(), state.qty + Number(b.dataset.step)));
      refresh();
    });
    el.querySelector('#stepper').addEventListener('change', (e) => {
      state.qty = Math.max(1, Math.min(room(), Math.floor(Number(e.target.value)) || 1));
      refresh();
    });
    addBtn.addEventListener('click', () => {
      const added = cart.add(p, state.variant, state.qty);
      if (!added) {
        toast('No more units available.', { tone: 'error' });
        return;
      }
      toast(`${added} × ${p.name} added to your cart`, { action: { label: 'View cart', onClick: openCart } });
      state.qty = 1;
      refresh();
    });
  },
};
