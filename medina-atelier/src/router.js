// Hash router: #/path?query. Hash URLs work on any static host with no
// server rewrites, and every page stays linkable and refresh-safe.

export function parseHash(hash = location.hash) {
  const h = hash.replace(/^#/, '') || '/';
  const [path, qs = ''] = h.split('?');
  return { path: path || '/', query: Object.fromEntries(new URLSearchParams(qs)) };
}

export function href(path, query = {}) {
  const qs = new URLSearchParams(Object.entries(query).filter(([, v]) => v !== '' && v != null && v !== false)).toString();
  return `#${path}${qs ? `?${qs}` : ''}`;
}

export function navigate(path, query) {
  location.hash = href(path, query);
}

/**
 * @param {{ el: HTMLElement, routes: {name:string, pattern:RegExp, view:object}[], onChange?: Function }} opts
 */
export function startRouter({ el, routes, onChange }) {
  let current = null; // { name, view, token }
  let token = 0;

  async function handle() {
    const { path, query } = parseHash();
    const route = routes.find((r) => r.pattern.test(path)) || routes.find((r) => r.name === 'notFound');
    const params = (path.match(route.pattern) || []).slice(1).map(decodeURIComponent);
    const myToken = ++token;
    const ctx = { el, params, query, path, isCurrent: () => myToken === token };

    onChange?.(route.name, query);

    // Same view, new query (e.g. shop filters): update in place, keep focus.
    if (current && current.name === route.name && route.view.update && current.paramsKey === params.join('/')) {
      current.token = myToken;
      await route.view.update(ctx);
      return;
    }

    current?.view.destroy?.();
    current = { name: route.name, view: route.view, paramsKey: params.join('/') };
    document.title = route.view.title ? `${route.view.title} · Medina Atelier` : 'Medina Atelier — Handmade in Algeria';
    window.scrollTo({ top: 0, behavior: 'instant' });
    el.focus({ preventScroll: true });
    try {
      await route.view.render(ctx);
    } catch (err) {
      console.error(err);
      if (ctx.isCurrent()) el.innerHTML = `<div class="container page"><p class="form-alert">Something went wrong: ${String(err.message).replace(/</g, '&lt;')}</p></div>`;
    }
  }

  window.addEventListener('hashchange', handle);
  handle();
  return { refresh: handle };
}
