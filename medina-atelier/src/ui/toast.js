// Small toast notifications, announced to screen readers.

import { escapeHtml } from '../lib/html.js';
import { icon } from './icons.js';

let region;

export function toast(message, { action = null, tone = 'default', timeout = 3500 } = {}) {
  region ||= document.getElementById('toasts');
  const el = document.createElement('div');
  el.className = `toast toast-${tone}`;
  el.innerHTML = `<span class="toast-icon">${icon(tone === 'error' ? 'alert' : 'check')}</span><span class="toast-msg">${escapeHtml(message)}</span>`;
  if (action) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'toast-action';
    btn.textContent = action.label;
    btn.addEventListener('click', () => {
      action.onClick();
      el.remove();
    });
    el.appendChild(btn);
  }
  region.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, timeout);
}
