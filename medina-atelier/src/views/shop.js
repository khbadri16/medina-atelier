import { html, raw } from '../lib/html.js';
import * as api from '../api/index.js';
import { href, navigate } from '../router.js';
import { icon } from '../ui/icons.js';
import { productGrid, skeletonGrid, emptyState, categoryName } from '../ui/components.js';
import { cart } from '../ui/cartStore.js';
import { pluralize } from '../lib/format.js';

const SORT_OPTIONS = [
  ['featured', 'Featured'],
  ['newest', 'Newest'],
  ['price-asc', 'Price: low to high'],
  ['price-desc', 'Price: high to low'],
  ['rating', 'Top rated'],
];

function readQuery(query) {
  const num = (v) => (v === undefined || v === '' || Number.isNaN(Number(v)) ? null : Number(v));
  return {
    q: query.q || '',
    category: query.category || '',
    sort: SORT_OPTIONS.some(([k]) => k === query.sort) ? query.sort : 'featured',
    min: num(query.min),
    max: num(query.max),
    inStock: query.stock === '1',
  };
}

function toQuery(f) {
  return { q: f.q, category: f.category, sort: f.sort === 'featured' ? '' : f.sort, min: f.min ?? '', max: f.max ?? '', stock: f.inStock ? '1' : '' };
}

let filters = null;

function go(patch) {
  const next = { ...filters, ...patch };
  navigate('/shop', toQuery(next));
}

async function load(el, isCurrent) {
  const results = el.querySelector('#results');
  results.innerHTML = String(skeletonGrid(8));
  const data = await api.listProducts(filters);
  if (!isCurrent()) return;
  cart.remember(data.items);

  // Category facet counts reflect the current search.
  el.querySelector('#cat-list').innerHTML = String(html`
    <li><a href="${href('/shop', toQuery({ ...filters, category: '' }))}" class="${!filters.category ? 'is-active' : ''}">All crafts <span>${data.facets.reduce((s, c) => s + c.count, 0)}</span></a></li>
    ${data.facets.map((c) => html`<li><a href="${href('/shop', toQuery({ ...filters, category: c.id }))}" class="${filters.category === c.id ? 'is-active' : ''}">${c.name} <span>${c.count}</span></a></li>`)}`);

  const chips = [];
  if (filters.q) chips.push(['q', `“${filters.q}”`]);
  if (filters.category) chips.push(['category', categoryName(filters.category)]);
  if (filters.min != null) chips.push(['min', `From ${filters.min.toLocaleString('fr-FR')} DA`]);
  if (filters.max != null) chips.push(['max', `Up to ${filters.max.toLocaleString('fr-FR')} DA`]);
  if (filters.inStock) chips.push(['inStock', 'In stock']);

  el.querySelector('#toolbar-info').innerHTML = String(html`
    <span class="count">${pluralize(data.total, 'product')}</span>
    ${chips.map(([k, label]) => html`<button type="button" class="chip-x" data-clear="${k}">${label} ${raw(icon('x'))}</button>`)}
    ${chips.length > 1 ? html`<button type="button" class="link-btn" data-clear="all">Clear all</button>` : ''}`);

  el.querySelector('#price-min').placeholder = String(data.priceBounds.min);
  el.querySelector('#price-max').placeholder = String(data.priceBounds.max);

  results.innerHTML = data.items.length
    ? String(productGrid(data.items))
    : String(emptyState({ title: 'No products match', text: 'Try a different search or remove a filter.', cta: 'Clear filters', href: '#/shop', iconName: 'search' }));
}

function syncControls(el) {
  const q = el.querySelector('#shop-q');
  if (document.activeElement !== q) q.value = filters.q; // don't fight the user while typing
  el.querySelector('#sort').value = filters.sort;
  el.querySelector('#price-min').value = filters.min ?? '';
  el.querySelector('#price-max').value = filters.max ?? '';
  el.querySelector('#in-stock').checked = filters.inStock;
  el.querySelector('#shop-title').textContent = filters.category ? categoryName(filters.category) : filters.q ? 'Search results' : 'All products';
}

export default {
  title: 'Shop',
  async render({ el, query, isCurrent }) {
    filters = readQuery(query);
    el.innerHTML = String(html`
      <div class="container page">
        <header class="page-head">
          <p class="eyebrow">Shop</p>
          <h1 id="shop-title">All products</h1>
        </header>
        <div class="shop">
          <aside class="filters" aria-label="Filters">
            <form class="filter-search" id="shop-search" role="search">
              ${raw(icon('search'))}
              <label class="sr-only" for="shop-q">Search products</label>
              <input id="shop-q" type="search" placeholder="Search vases, rugs, copper…" autocomplete="off">
            </form>
            <div class="filter-group">
              <h2>Craft</h2>
              <ul class="cat-list" id="cat-list"></ul>
            </div>
            <form class="filter-group" id="price-form">
              <h2>Price (DA)</h2>
              <div class="price-row">
                <label class="sr-only" for="price-min">Minimum price</label>
                <input id="price-min" type="number" min="0" step="100" inputmode="numeric">
                <span>–</span>
                <label class="sr-only" for="price-max">Maximum price</label>
                <input id="price-max" type="number" min="0" step="100" inputmode="numeric">
              </div>
              <button class="btn btn-ghost btn-sm" type="submit">Apply</button>
            </form>
            <label class="filter-group check">
              <input type="checkbox" id="in-stock"> <span>In stock only</span>
            </label>
          </aside>
          <section class="shop-main">
            <div class="toolbar">
              <div class="toolbar-info" id="toolbar-info"></div>
              <label class="sort">
                <span>Sort by</span>
                <select id="sort">${SORT_OPTIONS.map(([v, l]) => html`<option value="${v}">${l}</option>`)}</select>
              </label>
            </div>
            <div id="results"></div>
          </section>
        </div>
      </div>`);

    let debounce;
    el.querySelector('#shop-q').addEventListener('input', (e) => {
      clearTimeout(debounce);
      debounce = setTimeout(() => go({ q: e.target.value.trim() }), 300);
    });
    el.querySelector('#shop-search').addEventListener('submit', (e) => {
      e.preventDefault();
      clearTimeout(debounce);
      go({ q: el.querySelector('#shop-q').value.trim() });
    });
    el.querySelector('#sort').addEventListener('change', (e) => go({ sort: e.target.value }));
    el.querySelector('#in-stock').addEventListener('change', (e) => go({ inStock: e.target.checked }));
    el.querySelector('#price-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const min = el.querySelector('#price-min').value;
      const max = el.querySelector('#price-max').value;
      go({ min: min === '' ? null : Number(min), max: max === '' ? null : Number(max) });
    });
    el.querySelector('#toolbar-info').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-clear]');
      if (!btn) return;
      const k = btn.dataset.clear;
      if (k === 'all') navigate('/shop', {});
      else go({ [k]: k === 'inStock' ? false : k === 'min' || k === 'max' ? null : '' });
    });

    syncControls(el);
    await load(el, isCurrent);
  },

  async update({ el, query, isCurrent }) {
    filters = readQuery(query);
    const active = document.activeElement;
    syncControls(el);
    if (active && el.contains(active)) active.focus();
    await load(el, isCurrent);
  },
};
