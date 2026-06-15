import { CATEGORIES_MAP } from '../helpers/categories.js';

export function Breadcrumbs({ primary = [], alsoIn = [], current = '' }) {
  const primaryLinks = primary
    .map(({ label, href }) => `<a href="${href}">${label}</a>`)
    .join(' <span aria-hidden="true">›</span> ');

  const alsoInLabel = alsoIn.map(({ label }) => label).join(', ');
  const alsoInLinks = alsoIn.map(({ label, href }) => `<a href="${href}">${label}</a>`).join('<span class="breadcrumb-bullet"> · </span>');

  const alsoInHTML = alsoIn.length > 0
    ? `<span class="breadcrumb-also-in" aria-label="Also in: ${alsoInLabel}">Also in: ${alsoInLinks}</span>`
    : '';

  return `
    <nav aria-label="Breadcrumb" class="breadcrumb">
      <span class="breadcrumb-primary">
        ${primaryLinks}
        <span aria-hidden="true">›</span>
        <span aria-current="page">${current}</span>
      </span>
      ${alsoInHTML}
    </nav>
  `;
}

export function renderBreadcrumbs(props) {
  const container = document.getElementById('breadcrumbs');
  if (!container) return;
  container.innerHTML = Breadcrumbs(props);
}