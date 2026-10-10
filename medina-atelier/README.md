# Medina Atelier: e-commerce storefront

![Medina Atelier home page](assets/preview.jpg)

A complete demo online store for a **fictional** brand of handmade Algerian crafts. It covers everything from browsing to checkout to running the store: catalogue search and filters, product variants, a cart, a cash-on-delivery checkout with delivery fees per wilaya, order tracking, and an admin back office.

> Medina Atelier is not a real business. No real orders, payments or deliveries take place, and all data stays in your browser.

## Features

**Customer side**
- A catalogue with accent-insensitive **search**, category facets with live counts, a price range, an in-stock filter and sorting. All of the filter state lives in the URL, so every result is shareable.
- **Product pages** with variants: choosing a glaze or colour recolours the product illustration, and size options can change the price. Stock limits are enforced.
- A **cart drawer** with quantity controls, promo codes (`BIENVENUE10`, or `ATELIER2000` on orders over 20 000 DA) and a free-delivery progress bar.
- **Checkout** made for the Algerian market:
  - all 58 wilayas, grouped into delivery zones;
  - home delivery or stop-desk pickup, with live fees;
  - **cash on delivery**;
  - mobile-number validation that accepts `0555…`, `+213 5 55…` and `00213…`.
- **Order confirmation** with a status timeline, plus a "My orders" history.

**Back office (`#/admin`)**
- KPIs, a 14-day revenue chart, sales by category and low-stock alerts.
- Order management with a **state machine**: pending → confirmed → shipped → delivered, or cancelled (which puts the items back in stock).
- Inline editing of product price, stock and visibility, with server-side validation.

## Architecture

Plain JavaScript ES modules, with **no framework, no dependencies and no build step**. The code is organised in layers, the way a full-stack app would be:

```
src/
  api/            the "backend": async endpoints the UI calls
    index.js        listProducts, getProduct, placeOrder, adminUpdateOrderStatus, ...
    orderFactory.js prices items from the catalogue and builds order records
  data/           persistence + seed data
    db.js           one JSON document in localStorage, seeded on first visit
    seed.js         categories, 16 products, sample orders
    wilayas.js      58 wilayas → delivery zones
  domain/         pure business rules (unit-tested)
    pricing.js      promo codes, delivery fees, free-delivery threshold, totals
    cart.js         add / update / remove lines, stock caps across variants
    validation.js   checkout validation, phone normalisation
    orders.js       order status transitions
  ui/             components, cart store, toasts, procedural SVG product art
  views/          one module per page (home, shop, product, checkout, order, orders, admin)
  router.js       hash router (#/product/kabyle-painted-vase)
  lib/            html`` templating with auto-escaping, formatting, storage adapter
```

### Design decisions worth discussing

- **The UI talks only to an API layer.** `src/api/index.js` behaves like an HTTP backend: it adds network latency, validates every input, returns deep copies so the UI can't mutate the "database", and throws `ApiError` with status codes (404, 409, 422). Swapping it for `fetch()` calls to a real REST API (`GET /products`, `POST /orders`, `PATCH /admin/orders/:id`) would need **no UI changes**.
- **The server never trusts the client.** `placeOrder` re-validates the customer, recomputes every price from the catalogue (a forged `unitPrice` is ignored), re-checks promo codes, and checks stock across all variants before committing.
- **Concurrency-style conflicts are handled.** If stock drops between "add to cart" and "place order", the API returns `409` with the available quantities. The checkout then trims the cart and explains what changed, so the customer is never charged for something that can't ship.
- **Business rules are pure functions.** Pricing, cart operations, validation and order transitions have no DOM or storage dependencies, so they're shared between the UI (instant feedback) and the API (authoritative checks), and they're unit-tested.
- **XSS-safe rendering.** All HTML is built with an `html` tagged template that escapes interpolated values by default. Customer-entered names, notes and addresses can't inject markup.
- **Product images are code.** Each product is an SVG illustration generated from `{ type, palette }`, so there are no image files or licensing issues, and variants recolour instantly.

## Run locally

ES modules must be served over HTTP:

```bash
python -m http.server 8000
# or
npx serve .
```

Then open http://localhost:8000. In the browser console, `store` exposes the API, for example `await store.listProducts({ q: 'copper' })`.

## Tests

The tests use Node's built-in test runner (Node 18 or newer), so there's nothing to install:

```bash
npm test
```

There are 23 tests, covering:
- pricing, promo and delivery rules;
- cart stock caps across variants;
- checkout validation and phone normalisation;
- order transitions;
- HTML escaping;
- API behaviour: server-side price recomputation, stock conflicts with no side effects, restocking on cancel, persistence across reloads, and admin validation.

## Deploy

It's a static site. On Vercel, import the folder (framework preset: **Other**, no build command). On Netlify or GitHub Pages, publish the folder as-is.

---

Built by [Khelfat Badereddine](https://github.com/khbadri16).
