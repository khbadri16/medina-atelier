import { html, raw } from '../lib/html.js';
import * as api from '../api/index.js';
import { navigate } from '../router.js';
import { formatDA } from '../lib/format.js';
import { productArt } from '../ui/art.js';
import { icon } from '../ui/icons.js';
import { emptyState } from '../ui/components.js';
import { cart, myOrders, savedCustomer } from '../ui/cartStore.js';
import { detailedLines, refreshCartProducts } from '../ui/cartDrawer.js';
import { WILAYAS, findWilaya } from '../data/wilayas.js';
import { validateCheckout } from '../domain/validation.js';
import { shippingFee, FREE_SHIPPING_THRESHOLD } from '../domain/pricing.js';
import { lineKey } from '../domain/cart.js';
import { toast } from '../ui/toast.js';

const FIELDS = ['fullName', 'phone', 'email', 'wilaya', 'commune', 'method', 'address', 'notes'];

function field(name, label, { type = 'text', autocomplete = 'off', hint = '', placeholder = '', inputmode = '' } = {}) {
  return html`<div class="field" data-field="${name}">
    <label for="f-${name}">${label}</label>
    <input id="f-${name}" name="${name}" type="${type}" autocomplete="${autocomplete}" placeholder="${placeholder}" ${inputmode ? raw(`inputmode="${inputmode}"`) : ''}>
    ${hint ? html`<p class="hint">${hint}</p>` : ''}
    <p class="field-error" id="e-${name}" hidden></p>
  </div>`;
}

export default {
  title: 'Checkout',
  async render({ el, isCurrent }) {
    if (!cart.lines.length) {
      el.innerHTML = `<div class="container page">${emptyState({ title: 'Your cart is empty', text: 'Add something you love, then come back to check out.', cta: 'Browse the collection' })}</div>`;
      return;
    }
    el.innerHTML = '<div class="container page"><p class="loading">Loading your cart…</p></div>';
    await refreshCartProducts();
    if (!isCurrent()) return;

    const saved = savedCustomer.get() || {};
    el.innerHTML = String(html`
      <div class="container page">
        <header class="page-head">
          <a class="back" href="#/shop">${raw(icon('arrowLeft'))} Continue shopping</a>
          <h1>Checkout</h1>
        </header>
        <div class="checkout">
          <form class="co-form" id="co-form" novalidate>
            <div class="form-alert" id="form-alert" role="alert" hidden></div>

            <section class="co-section">
              <h2><span class="step">1</span> Contact</h2>
              <div class="grid-2">
                ${field('fullName', 'Full name', { autocomplete: 'name', placeholder: 'e.g. Amina Benali' })}
                ${field('phone', 'Mobile number', { type: 'tel', autocomplete: 'tel', inputmode: 'tel', placeholder: '0555 12 34 56', hint: 'The courier calls before delivering.' })}
              </div>
              ${field('email', 'Email (optional)', { type: 'email', autocomplete: 'email', placeholder: 'you@example.com', hint: 'For your order confirmation.' })}
            </section>

            <section class="co-section">
              <h2><span class="step">2</span> Delivery</h2>
              <div class="grid-2">
                <div class="field" data-field="wilaya">
                  <label for="f-wilaya">Wilaya</label>
                  <select id="f-wilaya" name="wilaya" autocomplete="address-level1">
                    <option value="">Choose…</option>
                    ${WILAYAS.map((w) => html`<option value="${w.code}">${String(w.code).padStart(2, '0')} · ${w.name}</option>`)}
                  </select>
                  <p class="field-error" id="e-wilaya" hidden></p>
                </div>
                ${field('commune', 'Commune', { autocomplete: 'address-level2', placeholder: 'e.g. El Bouni' })}
              </div>
              <fieldset class="field methods" data-field="method">
                <legend>Delivery method</legend>
                <label class="method">
                  <input type="radio" name="method" value="home">
                  <span class="method-body">${raw(icon('truck'))}<span><b>Home delivery</b><small>To your door in 2–5 days</small></span><span class="fee" data-fee="home">—</span></span>
                </label>
                <label class="method">
                  <input type="radio" name="method" value="desk">
                  <span class="method-body">${raw(icon('store'))}<span><b>Stop desk pickup</b><small>Collect from the courier's relay point</small></span><span class="fee" data-fee="desk">—</span></span>
                </label>
                <p class="field-error" id="e-method" hidden></p>
              </fieldset>
              <div class="field" data-field="address" id="address-field">
                <label for="f-address">Street address</label>
                <textarea id="f-address" name="address" rows="2" autocomplete="street-address" placeholder="Building, street, neighbourhood"></textarea>
                <p class="field-error" id="e-address" hidden></p>
              </div>
              <div class="field" data-field="notes">
                <label for="f-notes">Delivery notes (optional)</label>
                <textarea id="f-notes" name="notes" rows="2" maxlength="300" placeholder="Landmark, best time to call…"></textarea>
              </div>
            </section>

            <section class="co-section">
              <h2><span class="step">3</span> Payment</h2>
              <div class="pay-card">
                ${raw(icon('cash'))}
                <div><b>Cash on delivery</b><p>Pay the courier in cash when your parcel arrives. No card needed.</p></div>
                <span class="pay-check">${raw(icon('check'))}</span>
              </div>
            </section>

            <button type="submit" class="btn btn-primary btn-lg btn-block" id="place">Place order</button>
            <p class="demo-note">${raw(icon('alert'))} Demo store: no real order, payment or delivery takes place.</p>
          </form>

          <aside class="co-summary" aria-label="Order summary">
            <h2>Order summary</h2>
            <ul class="sum-lines" id="sum-lines"></ul>
            <div id="sum-totals"></div>
          </aside>
        </div>
      </div>`);

    const form = el.querySelector('#co-form');
    const touched = new Set();

    // Prefill from the last order placed in this browser.
    for (const [k, v] of Object.entries(saved)) {
      const input = form.elements[k];
      if (!input || v == null) continue;
      if (input instanceof RadioNodeList) [...input].forEach((r) => (r.checked = r.value === v));
      else input.value = v;
    }
    if (!form.elements.method.value) form.elements.method.value = 'home';

    const values = () => Object.fromEntries(FIELDS.map((k) => [k, form.elements[k]?.value ?? '']));

    function setError(name, message) {
      const err = el.querySelector(`#e-${name}`);
      const control = form.elements[name];
      if (!err) return;
      err.textContent = message || '';
      err.hidden = !message;
      const targets = control instanceof RadioNodeList ? [...control] : control ? [control] : [];
      targets.forEach((c) => {
        c.setAttribute('aria-invalid', message ? 'true' : 'false');
        if (message) c.setAttribute('aria-describedby', `e-${name}`);
        else c.removeAttribute('aria-describedby');
      });
    }

    function validate(showAll = false) {
      const result = validateCheckout(values());
      for (const name of FIELDS) setError(name, showAll || touched.has(name) ? result.errors[name] : '');
      return result;
    }

    function renderSummary() {
      const lines = detailedLines();
      const v = values();
      const totals = api.quote(lines, { promoCode: cart.promoCode, wilaya: v.wilaya, method: v.method });
      const w = findWilaya(v.wilaya);

      for (const m of ['home', 'desk']) {
        const fee = w ? shippingFee(w.zone, m) : null;
        el.querySelector(`[data-fee="${m}"]`).textContent = fee == null ? '—' : totals.freeShipping ? 'Free' : formatDA(fee);
      }
      el.querySelector('#address-field').hidden = v.method === 'desk';

      el.querySelector('#sum-lines').innerHTML = String(html`${lines.map((l) => html`<li>
        <span class="sl-art">${raw(productArt(l.art))}<span class="sl-qty">${l.qty}</span></span>
        <span class="sl-name">${l.product.name}${l.variantName ? html`<small>${l.variantName}</small>` : ''}</span>
        <span class="sl-price">${formatDA(l.unitPrice * l.qty)}</span>
      </li>`)}`);

      el.querySelector('#sum-totals').innerHTML = String(html`
        ${totals.promo
          ? html`<div class="promo-applied">${raw(icon('tag'))}<span><b>${totals.promo.code}</b> · ${totals.promo.label}</span><button type="button" class="link-btn" data-promo-remove>Remove</button></div>`
          : html`<form class="promo-form" id="co-promo"><label class="sr-only" for="co-promo-input">Promo code</label><input id="co-promo-input" name="code" placeholder="Promo code" value="${cart.promoCode}" autocomplete="off"><button class="btn btn-ghost btn-sm" type="submit">Apply</button></form>
            ${totals.promoError ? html`<p class="field-error">${totals.promoError}</p>` : ''}`}
        <dl class="totals">
          <div><dt>Subtotal</dt><dd>${formatDA(totals.subtotal)}</dd></div>
          ${totals.discount ? html`<div class="is-discount"><dt>Discount</dt><dd>−${formatDA(totals.discount)}</dd></div>` : ''}
          <div><dt>Delivery${w ? html` <small>to ${w.name}</small>` : ''}</dt><dd>${totals.shipping == null ? 'Choose a wilaya' : totals.shipping === 0 ? 'Free' : formatDA(totals.shipping)}</dd></div>
          <div class="is-total"><dt>Total <small>cash on delivery</small></dt><dd>${formatDA(totals.total)}</dd></div>
        </dl>
        ${!totals.freeShipping ? html`<p class="hint">Free delivery on orders over ${formatDA(FREE_SHIPPING_THRESHOLD)}.</p>` : ''}`);

      el.querySelector('#place').textContent = `Place order · ${formatDA(totals.total)}`;
    }

    form.addEventListener('input', (e) => {
      if (e.target.name === 'wilaya' || e.target.name === 'method') renderSummary();
      if (touched.has(e.target.name)) validate();
    });
    form.addEventListener('change', (e) => {
      touched.add(e.target.name);
      renderSummary();
      validate();
    });
    form.addEventListener('focusout', (e) => {
      if (e.target.name && e.target.value) {
        touched.add(e.target.name);
        validate();
      }
    });

    el.querySelector('.co-summary').addEventListener('submit', (e) => {
      e.preventDefault();
      cart.setPromo(new FormData(e.target).get('code').trim().toUpperCase());
      renderSummary();
    });
    el.querySelector('.co-summary').addEventListener('click', (e) => {
      if (e.target.closest('[data-promo-remove]')) {
        cart.setPromo('');
        renderSummary();
      }
    });

    const alertBox = el.querySelector('#form-alert');
    function showAlert(message, list = []) {
      alertBox.innerHTML = String(html`${raw(icon('alert'))}<div><b>${message}</b>${list.length ? html`<ul>${list.map((x) => html`<li>${x}</li>`)}</ul>` : ''}</div>`);
      alertBox.hidden = false;
      alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      alertBox.hidden = true;
      const check = validate(true);
      if (!check.ok) {
        const first = FIELDS.find((f) => check.errors[f]);
        const target = form.elements[first];
        (target instanceof RadioNodeList ? target[0] : target)?.focus();
        return;
      }
      const btn = el.querySelector('#place');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner" aria-hidden="true"></span> Placing your order…';
      try {
        const order = await api.placeOrder({ customer: values(), items: cart.lines, promoCode: cart.promoCode });
        const { notes, ...remember } = values();
        savedCustomer.set(remember);
        myOrders.add(order.id);
        cart.clear();
        navigate(`/order/${order.id}`, { placed: '1' });
      } catch (err) {
        btn.disabled = false;
        renderSummary();
        if (err.status === 422 && err.fields) {
          for (const [k, msg] of Object.entries(err.fields)) {
            if (k === 'promoCode') continue;
            touched.add(k);
            setError(k, msg);
          }
          showAlert(err.message);
        } else if (err.status === 409 && Array.isArray(err.details)) {
          // Stock changed since the cart was filled: fix quantities and explain.
          const list = [];
          for (const d of err.details) {
            let remaining = d.available ?? 0; // unavailable items (no `available`) are removed entirely
            for (const l of cart.lines.filter((x) => x.productId === d.productId)) {
              const keep = Math.min(l.qty, remaining);
              remaining -= keep;
              cart.setQty(lineKey(l.productId, l.variant), keep);
            }
            const name = d.name || cart.product(d.productId)?.name || 'An item';
            list.push(d.available ? `${name}: only ${d.available} left, so we updated your cart.` : `${name} is no longer available and was removed.`);
          }
          await refreshCartProducts();
          renderSummary();
          showAlert(err.message, list);
          if (!cart.lines.length) toast('Your cart is now empty.', { tone: 'error' });
        } else {
          showAlert(err.message || 'Something went wrong. Please try again.');
        }
      }
    });

    renderSummary();
  },
};
