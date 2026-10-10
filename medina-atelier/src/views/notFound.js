import { emptyState } from '../ui/components.js';

export default {
  title: 'Page not found',
  render({ el }) {
    el.innerHTML = `<div class="container page">${emptyState({ title: 'Page not found', text: 'The page you are looking for does not exist or has moved.', cta: 'Go to the shop', iconName: 'search' })}</div>`;
  },
};
