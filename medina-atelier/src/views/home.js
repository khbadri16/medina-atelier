import { html, raw } from '../lib/html.js';
import * as api from '../api/index.js';
import { CATEGORIES } from '../data/seed.js';
import { productArt } from '../ui/art.js';
import { icon } from '../ui/icons.js';
import { productGrid, skeletonGrid } from '../ui/components.js';
import { cart } from '../ui/cartStore.js';
import { FREE_SHIPPING_THRESHOLD } from '../domain/pricing.js';
import { formatDA } from '../lib/format.js';

export default {
  title: '',
  async render({ el, isCurrent }) {
    el.innerHTML = String(html`
      <section class="hero">
        <div class="container hero-grid">
          <div class="hero-copy">
            <p class="eyebrow">Handmade in Algeria</p>
            <h1>Objects with a story, <em>made by hand.</em></h1>
            <p class="lead">Pottery from Kabylie, copper from Constantine, wool from the Aurès. We work directly with artisans across Algeria and deliver to your door, and you pay in cash when your order arrives.</p>
            <div class="hero-ctas">
              <a class="btn btn-primary" href="#/shop">Shop the collection ${raw(icon('arrowRight'))}</a>
              <a class="btn btn-ghost" href="#/shop?category=ceramics">Explore ceramics</a>
            </div>
          </div>
          <div class="hero-art" aria-hidden="true">
            <div class="ha ha-1">${raw(productArt({ type: 'vase', palette: 'terracotta' }, { cover: true }))}</div>
            <div class="ha ha-2">${raw(productArt({ type: 'tray', palette: 'copper' }, { cover: true }))}</div>
            <div class="ha ha-3">${raw(productArt({ type: 'rug', palette: 'wool' }, { cover: true }))}</div>
            <div class="hero-chip">${raw(icon('truck'))}<span>Free delivery over <b>${formatDA(FREE_SHIPPING_THRESHOLD)}</b></span></div>
          </div>
        </div>
      </section>

      <section class="perks container" aria-label="Why shop with us">
        <div class="perk">${raw(icon('cash'))}<div><b>Cash on delivery</b><span>Pay the courier when it arrives</span></div></div>
        <div class="perk">${raw(icon('truck'))}<div><b>Delivery across Algeria</b><span>Home or relay-point pickup</span></div></div>
        <div class="perk">${raw(icon('refresh'))}<div><b>14-day returns</b><span>Not right? Send it back</span></div></div>
        <div class="perk">${raw(icon('hand'))}<div><b>Made by hand</b><span>Small batches, no two alike</span></div></div>
      </section>

      <section class="section container">
        <header class="section-head">
          <div><p class="eyebrow">Browse</p><h2>Shop by craft</h2></div>
          <a class="link-arrow" href="#/shop">All products ${raw(icon('arrowRight'))}</a>
        </header>
        <div class="cat-grid">
          ${CATEGORIES.map((c) => html`<a class="cat-tile" href="#/shop?category=${c.id}">
            ${raw(productArt(c.art))}
            <span class="cat-label"><b>${c.name}</b><span>${c.blurb}</span></span>
          </a>`)}
        </div>
      </section>

      <section class="section container">
        <header class="section-head">
          <div><p class="eyebrow">Loved by customers</p><h2>Bestsellers</h2></div>
          <a class="link-arrow" href="#/shop?sort=rating">Top rated ${raw(icon('arrowRight'))}</a>
        </header>
        <div id="featured">${skeletonGrid(4)}</div>
      </section>

      <section class="container">
        <div class="promo-banner">
          <div>
            <p class="eyebrow">First order?</p>
            <h2>Take <em>10% off</em> with code <span class="code">BIENVENUE10</span></h2>
            <p>Apply it in your cart. You can combine it with free delivery on orders over ${formatDA(FREE_SHIPPING_THRESHOLD)}.</p>
          </div>
          <button type="button" class="btn btn-primary" data-copy-code="BIENVENUE10">${raw(icon('copy'))} Copy code</button>
        </div>
      </section>

      <section class="section container story">
        <header class="section-head">
          <div><p class="eyebrow">From the workshop</p><h2>Three crafts, three regions</h2></div>
        </header>
        <div class="story-grid">
          <article><span class="story-no">01</span><h3>Kabylie pottery</h3><p>Women potters shape red clay by hand, without a wheel, and paint it with mineral pigments in motifs that carry family and village identity.</p></article>
          <article><span class="story-no">02</span><h3>Constantine copper</h3><p>The city's coppersmiths hammer, chase and engrave trays and pots by hand, a skill handed down through generations of workshops.</p></article>
          <article><span class="story-no">03</span><h3>Aurès wool</h3><p>In the Aurès mountains, wool is spun and knotted on upright looms into thick rugs whose patterns are drawn from memory.</p></article>
        </div>
      </section>

      <section class="section container">
        <header class="section-head">
          <div><p class="eyebrow">Just in</p><h2>New arrivals</h2></div>
          <a class="link-arrow" href="#/shop?sort=newest">See what's new ${raw(icon('arrowRight'))}</a>
        </header>
        <div id="newest">${skeletonGrid(4)}</div>
      </section>`);

    el.querySelector('[data-copy-code]').addEventListener('click', async (e) => {
      const code = e.currentTarget.dataset.copyCode;
      try {
        await navigator.clipboard.writeText(code);
      } catch { /* clipboard may be blocked */ }
      cart.setPromo(code);
      const { toast } = await import('../ui/toast.js');
      toast(`${code} copied and applied to your cart`);
    });

    const [featured, newest] = await Promise.all([
      api.listProducts({ sort: 'featured' }),
      api.listProducts({ sort: 'newest' }),
    ]);
    if (!isCurrent()) return;
    cart.remember(featured.items);
    el.querySelector('#featured').innerHTML = String(productGrid(featured.items.filter((p) => p.featured).slice(0, 4), { cols: 4 }));
    el.querySelector('#newest').innerHTML = String(productGrid(newest.items.slice(0, 4), { cols: 4 }));
  },
};
