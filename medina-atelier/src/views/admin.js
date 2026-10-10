import { html, raw } from '../lib/html.js';
import * as api from '../api/index.js';
import { href } from '../router.js';
import { formatDA, formatDate, formatDateTime, formatPhone, pluralize } from '../lib/format.js';
import { productArt } from '../ui/art.js';
import { icon } from '../ui/icons.js';
import { statusBadge, categoryName } from '../ui/components.js';
import { toast } from '../ui/toast.js';
import { TRANSITIONS, STATUS_LABEL } from '../domain/orders.js';

const TABS = [['overview', 'Overview'], ['orders', 'Orders'], ['products', 'Products']];
const ACTION_LABEL = { confirmed: 'Confirm', shipped: 'Mark shipped', delivered: 'Mark delivered', cancelled: 'Cancel' };

function revenueChart(days) {
  const W = 1100;
  const H = 230;
  const pad = { l: 8, r: 8, t: 14, b: 26 };
  const max = Math.max(1, ...days.map((d) => d.revenue));
  const bw = (W - pad.l - pad.r) / days.length;
  const bars = days.map((d, i) => {
    const h = (d.revenue / max) * (H - pad.t - pad.b);
    const x = pad.l + i * bw + bw * 0.18;
    const y = H - pad.b - h;
    const date = new Date(d.date);
    const label = i % 2 === 0 || i === days.length - 1 ? `<text x="${x + bw * 0.32}" y="${H - 8}">${date.getDate()}/${date.getMonth() + 1}</text>` : '';
    return `<g><rect class="${d.revenue ? '' : 'empty'}" x="${x}" y="${d.revenue ? y : H - pad.b - 2}" width="${bw * 0.64}" height="${d.revenue ? Math.max(2, h) : 2}" rx="4"><title>${formatDate(d.date)}: ${formatDA(d.revenue)} (${pluralize(d.orders, 'order')})</title></rect>${label}</g>`;
  }).join('');
  return `<svg class="bar-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Revenue per day over the last 14 days">${bars}</svg>`;
}

async function overview(body, isCurrent) {
  const s = await api.adminStats();
  if (!isCurrent()) return;
  const maxCat = Math.max(1, ...s.byCategory.map((c) => c.revenue));
  body.innerHTML = String(html`
    <div class="kpis">
      <div class="kpi"><span>Revenue</span><b>${formatDA(s.revenue)}</b><small>Excludes cancelled orders</small></div>
      <div class="kpi"><span>Orders</span><b>${s.orders}</b><small>All time</small></div>
      <div class="kpi"><span>Average order</span><b>${formatDA(s.averageOrder)}</b><small>Revenue ÷ orders</small></div>
      <a class="kpi kpi-link" href="${href('/admin', { tab: 'orders', status: 'pending' })}"><span>Awaiting confirmation</span><b>${s.pending}</b><small>View pending orders →</small></a>
    </div>
    <div class="admin-grid">
      <section class="panel span-2">
        <div class="panel-head"><h2>Revenue, last 14 days</h2></div>
        ${raw(revenueChart(s.days))}
      </section>
      <section class="panel">
        <div class="panel-head"><h2>Sales by craft</h2></div>
        <ul class="hbars">${s.byCategory.map((c) => html`<li>
          <span class="hb-label">${c.name}</span>
          <span class="hb-track"><span style="width:${(c.revenue / maxCat) * 100}%"></span></span>
          <span class="hb-value">${formatDA(c.revenue)}</span>
        </li>`)}</ul>
      </section>
      <section class="panel">
        <div class="panel-head"><h2>Low stock</h2><a class="link-btn" href="${href('/admin', { tab: 'products' })}">Manage</a></div>
        ${s.lowStock.length ? html`<ul class="low-stock">${s.lowStock.map((p) => html`<li><span>${p.name}</span><span class="stock ${p.stock ? 'stock-low' : 'stock-out'}">${p.stock ? `${p.stock} left` : 'Sold out'}</span></li>`)}</ul>` : html`<p class="muted">Everything is well stocked.</p>`}
      </section>
      <section class="panel span-2">
        <div class="panel-head"><h2>Recent orders</h2><a class="link-btn" href="${href('/admin', { tab: 'orders' })}">All orders</a></div>
        ${ordersTable(s.recent, { actions: false })}
      </section>
    </div>`);
}

function ordersTable(orders, { actions = true } = {}) {
  if (!orders.length) return html`<p class="muted empty-row">No orders with this status.</p>`;
  return html`<div class="table-wrap"><table class="table">
    <thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Wilaya</th><th class="num">Total</th><th>Status</th>${actions ? html`<th><span class="sr-only">Actions</span></th>` : ''}</tr></thead>
    <tbody>${orders.map((o) => html`<tr>
      <td><a href="#/order/${o.id}" class="mono">${o.number}</a></td>
      <td class="muted">${formatDateTime(o.createdAt)}</td>
      <td>${o.customer.fullName}<small class="muted block">${formatPhone(o.customer.phone)}</small></td>
      <td>${o.delivery.wilayaName}<small class="muted block">${o.delivery.method === 'home' ? 'Home' : 'Stop desk'}</small></td>
      <td class="num">${formatDA(o.totals.total)}</td>
      <td>${statusBadge(o.status)}</td>
      ${actions ? html`<td class="actions">${TRANSITIONS[o.status].map((to) => html`<button type="button" class="btn btn-sm ${to === 'cancelled' ? 'btn-danger' : 'btn-ghost'}" data-order="${o.id}" data-to="${to}" data-number="${o.number}">${ACTION_LABEL[to]}</button>`)}</td>` : ''}
    </tr>`)}</tbody>
  </table></div>`;
}

async function ordersTab(body, query, isCurrent) {
  const all = await api.adminListOrders();
  if (!isCurrent()) return;
  const status = query.status || '';
  const counts = Object.fromEntries(Object.keys(STATUS_LABEL).map((s) => [s, all.filter((o) => o.status === s).length]));
  const shown = status ? all.filter((o) => o.status === status) : all;
  body.innerHTML = String(html`
    <div class="status-filter" role="group" aria-label="Filter by status">
      <a href="${href('/admin', { tab: 'orders' })}" class="${!status ? 'is-active' : ''}">All <span>${all.length}</span></a>
      ${Object.entries(STATUS_LABEL).map(([s, label]) => html`<a href="${href('/admin', { tab: 'orders', status: s })}" class="${status === s ? 'is-active' : ''}">${label} <span>${counts[s]}</span></a>`)}
    </div>
    <section class="panel">${ordersTable(shown)}</section>`);
}

async function productsTab(body, isCurrent) {
  const products = await api.adminListProducts();
  if (!isCurrent()) return;
  body.innerHTML = String(html`
    <section class="panel">
      <div class="table-wrap"><table class="table products-table">
        <thead><tr><th>Product</th><th>Price (DA)</th><th>Stock</th><th>Visible</th><th><span class="sr-only">Save</span></th></tr></thead>
        <tbody>${products.map((p) => html`<tr data-id="${p.id}">
          <td><span class="prod-cell"><span class="thumb">${raw(productArt(p.art))}</span><span><b>${p.name}</b><small class="muted block">${categoryName(p.category)}</small></span></span></td>
          <td><input class="cell-input" type="number" name="price" min="100" step="100" value="${p.price}" data-initial="${p.price}" aria-label="Price of ${p.name}"></td>
          <td><input class="cell-input" type="number" name="stock" min="0" step="1" value="${p.stock}" data-initial="${p.stock}" aria-label="Stock of ${p.name}"></td>
          <td><label class="switch"><input type="checkbox" name="active" ${p.active ? 'checked' : ''} data-initial="${p.active ? '1' : '0'}"><span aria-hidden="true"></span><span class="sr-only">Visible in the shop</span></label></td>
          <td class="actions"><button type="button" class="btn btn-sm btn-ghost" data-save disabled>Save</button><p class="field-error" hidden></p></td>
        </tr>`)}</tbody>
      </table></div>
    </section>`);
}

export default {
  title: 'Store admin',
  async render(ctx) {
    const { el } = ctx;
    el.innerHTML = String(html`
      <div class="container page admin">
        <header class="page-head admin-head">
          <div><p class="eyebrow">Back office</p><h1>Store admin</h1></div>
          <button type="button" class="btn btn-ghost btn-sm" id="reset">${raw(icon('refresh'))} Reset demo data</button>
        </header>
        <p class="notice">${raw(icon('alert'))} Demo dashboard. In a real store this page would sit behind authentication and role-based access.</p>
        <nav class="tabs" id="admin-tabs" aria-label="Admin sections">
          ${TABS.map(([id, label]) => html`<a href="${href('/admin', { tab: id })}" data-tab="${id}">${label}</a>`)}
        </nav>
        <div id="admin-body"><p class="loading">Loading…</p></div>
      </div>`);

    el.querySelector('#reset').addEventListener('click', async () => {
      if (!confirm('Reset all products and orders to the demo data? Orders you placed will be removed.')) return;
      await api.adminResetDemo();
      toast('Demo data has been reset.');
      this.update(this.lastCtx);
    });

    const body = el.querySelector('#admin-body');
    body.addEventListener('click', async (e) => {
      const action = e.target.closest('[data-order]');
      if (action) {
        const { order, to, number } = action.dataset;
        if (to === 'cancelled' && !confirm(`Cancel order ${number}? Its items will go back into stock.`)) return;
        action.disabled = true;
        try {
          await api.adminUpdateOrderStatus(order, to);
          toast(`${number} marked as ${STATUS_LABEL[to].toLowerCase()}.`);
        } catch (err) {
          toast(err.message, { tone: 'error' });
        }
        this.update(this.lastCtx);
        return;
      }
      const save = e.target.closest('[data-save]');
      if (save) {
        const row = save.closest('tr');
        const patch = {
          price: Number(row.querySelector('[name="price"]').value),
          stock: Number(row.querySelector('[name="stock"]').value),
          active: row.querySelector('[name="active"]').checked,
        };
        const err = row.querySelector('.field-error');
        save.disabled = true;
        try {
          const p = await api.adminUpdateProduct(row.dataset.id, patch);
          err.hidden = true;
          row.querySelector('[name="price"]').dataset.initial = p.price;
          row.querySelector('[name="stock"]').dataset.initial = p.stock;
          row.querySelector('[name="active"]').dataset.initial = p.active ? '1' : '0';
          toast(`${p.name} updated.`);
        } catch (ex) {
          err.textContent = ex.fields ? Object.values(ex.fields).join(' ') : ex.message;
          err.hidden = false;
          save.disabled = false;
        }
      }
    });
    body.addEventListener('input', (e) => {
      const row = e.target.closest('tr[data-id]');
      if (!row) return;
      const dirty = [...row.querySelectorAll('[data-initial]')].some((i) => (i.type === 'checkbox' ? (i.checked ? '1' : '0') : i.value) !== i.dataset.initial);
      row.querySelector('[data-save]').disabled = !dirty;
    });

    await this.update(ctx);
  },

  async update(ctx) {
    this.lastCtx = ctx;
    const { el, query, isCurrent } = ctx;
    const tab = TABS.some(([id]) => id === query.tab) ? query.tab : 'overview';
    el.querySelectorAll('#admin-tabs a').forEach((a) => a.setAttribute('aria-current', a.dataset.tab === tab ? 'page' : 'false'));
    const body = el.querySelector('#admin-body');
    if (tab === 'overview') await overview(body, isCurrent);
    else if (tab === 'orders') await ordersTab(body, query, isCurrent);
    else await productsTab(body, isCurrent);
  },
};
