import { html, raw } from '../lib/html.js';
import * as api from '../api/index.js';
import { formatDA, formatDate, pluralize } from '../lib/format.js';
import { productArt } from '../ui/art.js';
import { statusBadge, emptyState } from '../ui/components.js';
import { myOrders } from '../ui/cartStore.js';

export default {
  title: 'My orders',
  async render({ el, isCurrent }) {
    const ids = myOrders.ids();
    if (!ids.length) {
      el.innerHTML = `<div class="container page">${emptyState({ title: 'No orders yet', text: 'Orders you place from this browser will appear here.', cta: 'Start shopping', iconName: 'receipt' })}</div>`;
      return;
    }
    el.innerHTML = '<div class="container page"><p class="loading">Loading your orders…</p></div>';
    const orders = await api.getOrders(ids);
    if (!isCurrent()) return;
    orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    el.innerHTML = String(html`
      <div class="container page">
        <header class="page-head"><p class="eyebrow">Account</p><h1>My orders</h1><p class="muted">Orders placed from this browser.</p></header>
        <ul class="order-list">${orders.map((o) => html`<li>
          <a class="order-row" href="#/order/${o.id}">
            <span class="or-arts">${o.items.slice(0, 3).map((i) => raw(productArt(i.art)))}</span>
            <span class="or-main"><b>${o.number}</b><span class="muted">${formatDate(o.createdAt)} · ${pluralize(o.items.reduce((s, i) => s + i.qty, 0), 'item')}</span></span>
            ${statusBadge(o.status)}
            <span class="or-total">${formatDA(o.totals.total)}</span>
          </a>
        </li>`)}</ul>
      </div>`);
  },
};
