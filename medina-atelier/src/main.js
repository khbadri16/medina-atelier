// Medina Atelier: app bootstrap.

import { startRouter, navigate } from './router.js';
import { cart } from './ui/cartStore.js';
import { initCartDrawer, openCart, refreshCartProducts } from './ui/cartDrawer.js';
import { toast } from './ui/toast.js';
import * as api from './api/index.js';

import home from './views/home.js';
import shop from './views/shop.js';
import product from './views/product.js';
import checkout from './views/checkout.js';
import order from './views/order.js';
import orders from './views/orders.js';
import admin from './views/admin.js';
import notFound from './views/notFound.js';

const routes = [
  { name: 'home', pattern: /^\/$/, view: home },
  { name: 'shop', pattern: /^\/shop$/, view: shop },
  { name: 'product', pattern: /^\/product\/([\w-]+)$/, view: product },
  { name: 'checkout', pattern: /^\/checkout$/, view: checkout },
  { name: 'order', pattern: /^\/order\/([\w-]+)$/, view: order },
  { name: 'orders', pattern: /^\/orders$/, view: orders },
  { name: 'admin', pattern: /^\/admin$/, view: admin },
  { name: 'notFound', pattern: /^$/, view: notFound },
];

/* Header: cart count */
function renderCount() {
  const n = cart.count;
  const badge = document.getElementById('cart-count');
  badge.textContent = String(n);
  badge.hidden = n === 0;
  document.getElementById('cart-btn').setAttribute('aria-label', `Open cart, ${n} ${n === 1 ? 'item' : 'items'}`);
}
cart.subscribe(renderCount);
renderCount();

document.getElementById('cart-btn').addEventListener('click', openCart);

/* Header: search */
const searchForm = document.getElementById('search');
searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const q = searchForm.elements.q.value.trim();
  navigate('/shop', { q });
});

/* Quick "Add to cart" buttons on product cards (event delegation). */
document.getElementById('app').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-add]');
  if (!btn) return;
  const p = cart.product(btn.dataset.add);
  if (!p) return;
  const added = cart.add(p, null, 1);
  if (added) toast(`${p.name} added to your cart`, { action: { label: 'View cart', onClick: openCart } });
  else toast('No more units available.', { tone: 'error' });
});

initCartDrawer();
refreshCartProducts().catch(() => {});

startRouter({
  el: document.getElementById('app'),
  routes,
  onChange(name, query) {
    document.querySelectorAll('[data-nav]').forEach((a) => {
      const match = a.dataset.nav === name && (!a.dataset.cat || a.dataset.cat === (query.category || ''));
      a.toggleAttribute('aria-current', match);
    });
    if (name !== 'shop') searchForm.elements.q.value = '';
    else if (document.activeElement !== searchForm.elements.q) searchForm.elements.q.value = query.q || '';
  },
});

document.getElementById('year').textContent = new Date().getFullYear();

// Expose the API in the dev console, e.g. await store.listProducts({ q: 'copper' })
window.store = api;
