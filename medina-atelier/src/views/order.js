import { html, raw } from '../lib/html.js';
import * as api from '../api/index.js';
import { formatDA, formatDateTime, formatPhone } from '../lib/format.js';
import { productArt } from '../ui/art.js';
import { icon } from '../ui/icons.js';
import { statusBadge, errorState } from '../ui/components.js';
import { STATUS_FLOW, STATUS_LABEL } from '../domain/orders.js';

function timeline(order) {
  if (order.status === 'cancelled') {
    return html`<ol class="timeline is-cancelled">${order.history.map((h) => html`<li class="done"><b>${STATUS_LABEL[h.status]}</b><span>${formatDateTime(h.at)}</span></li>`)}</ol>`;
  }
  const reached = STATUS_FLOW.indexOf(order.status);
  return html`<ol class="timeline">${STATUS_FLOW.map((s, i) => {
    const h = order.history.find((x) => x.status === s);
    return html`<li class="${i <= reached ? 'done' : ''} ${i === reached ? 'current' : ''}"><b>${STATUS_LABEL[s]}</b><span>${h ? formatDateTime(h.at) : '—'}</span></li>`;
  })}</ol>`;
}

export default {
  title: 'Your order',
  async render({ el, params, query, isCurrent }) {
    el.innerHTML = '<div class="container page"><p class="loading">Loading order…</p></div>';
    let order;
    try {
      order = await api.getOrder(params[0]);
    } catch (err) {
      if (isCurrent()) el.innerHTML = `<div class="container page">${errorState(err)}</div>`;
      return;
    }
    if (!isCurrent()) return;
    document.title = `Order ${order.number} · Medina Atelier`;
    const firstName = order.customer.fullName.split(' ')[0];
    const placed = query.placed === '1';
    const d = order.delivery;

    el.innerHTML = String(html`
      <div class="container page order-page">
        ${placed ? html`<div class="success">
          <span class="success-icon">${raw(icon('check'))}</span>
          <div>
            <h1>Thank you, ${firstName}!</h1>
            <p>Your order <b>${order.number}</b> has been placed. We'll call <b>${formatPhone(order.customer.phone)}</b> to confirm it before shipping.</p>
          </div>
        </div>` : html`<header class="page-head"><p class="eyebrow">Order</p><h1>${order.number}</h1></header>`}

        <div class="order-grid">
          <section class="panel">
            <div class="panel-head"><h2>Status</h2>${statusBadge(order.status)}</div>
            ${timeline(order)}
          </section>

          <section class="panel">
            <div class="panel-head"><h2>Items</h2><span class="muted">Placed ${formatDateTime(order.createdAt)}</span></div>
            <ul class="sum-lines">${order.items.map((l) => html`<li>
              <span class="sl-art">${raw(productArt(l.art))}<span class="sl-qty">${l.qty}</span></span>
              <span class="sl-name"><a href="#/product/${l.slug}">${l.name}</a>${l.variantName ? html`<small>${l.variantLabel}: ${l.variantName}</small>` : ''}<small>${formatDA(l.unitPrice)} each</small></span>
              <span class="sl-price">${formatDA(l.lineTotal)}</span>
            </li>`)}</ul>
            <dl class="totals">
              <div><dt>Subtotal</dt><dd>${formatDA(order.totals.subtotal)}</dd></div>
              ${order.totals.discount ? html`<div class="is-discount"><dt>Discount ${order.promoCode ? html`<small>${order.promoCode}</small>` : ''}</dt><dd>−${formatDA(order.totals.discount)}</dd></div>` : ''}
              <div><dt>Delivery</dt><dd>${order.totals.shipping ? formatDA(order.totals.shipping) : 'Free'}</dd></div>
              <div class="is-total"><dt>Total <small>to pay in cash</small></dt><dd>${formatDA(order.totals.total)}</dd></div>
            </dl>
          </section>

          <section class="panel">
            <div class="panel-head"><h2>Delivery</h2></div>
            <dl class="specs">
              <div><dt>Name</dt><dd>${order.customer.fullName}</dd></div>
              <div><dt>Phone</dt><dd>${formatPhone(order.customer.phone)}</dd></div>
              <div><dt>Method</dt><dd>${d.method === 'home' ? 'Home delivery' : 'Stop desk pickup'}</dd></div>
              <div><dt>Address</dt><dd>${d.address ? html`${d.address}, ` : ''}${d.commune}, ${d.wilayaName}</dd></div>
              ${order.notes ? html`<div><dt>Notes</dt><dd>${order.notes}</dd></div>` : ''}
              <div><dt>Payment</dt><dd>Cash on delivery</dd></div>
            </dl>
          </section>
        </div>

        <div class="order-actions">
          <a class="btn btn-primary" href="#/shop">Continue shopping</a>
          <a class="btn btn-ghost" href="#/orders">${raw(icon('receipt'))} My orders</a>
        </div>
      </div>`);
  },
};
