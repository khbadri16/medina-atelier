// Tiny HTML templating with automatic escaping.
//
//   html`<p>${userInput}</p>`   -> userInput is escaped
//   html`<ul>${items.map(i => html`<li>${i}</li>`)}</ul>`   -> nested templates are kept
//   raw(trustedMarkup)          -> opt out of escaping (only for markup we generate)

class SafeHtml {
  constructor(value) {
    this.value = value;
  }
  toString() {
    return this.value;
  }
}

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

function toHtml(value) {
  if (value == null || value === false) return '';
  if (value instanceof SafeHtml) return value.value;
  if (Array.isArray(value)) return value.map(toHtml).join('');
  return escapeHtml(value);
}

export function html(strings, ...values) {
  let out = '';
  strings.forEach((s, i) => {
    out += s;
    if (i < values.length) out += toHtml(values[i]);
  });
  return new SafeHtml(out);
}

export function raw(markup) {
  return new SafeHtml(String(markup));
}
