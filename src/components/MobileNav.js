import { CATEGORIES } from '../helpers/categories.js';
import { loadCategories } from '../functions.js';

export async function buildMobileNav() {
  const mobileNav = document.getElementById('mobile-nav');
  if (!mobileNav) return;

  try {
   const { grouped } = await loadCategories();

    // Filter groups to only those with at least one active category
    const activeGroups = Object.entries(grouped).filter(([, cats]) =>
      cats.some(cat => cat.recipeCount > 0)
    );

    const html = `
      <ul class="mobile-nav-list">
        ${activeGroups.map(([group, cats]) => {
          const activeCats = cats.filter(cat => cat.recipeCount > 0);
          const groupId = `mobile-group-${group.toLowerCase()}`;
          return `
            <li class="mobile-nav-group">
              <button class="mobile-nav-group-btn" aria-expanded="false" aria-controls="${groupId}">
                ${group}
                <i class="fa fa-chevron-right"></i>
              </button>
              <ul id="${groupId}" class="mobile-nav-subcategories" hidden>
                ${activeCats.map(cat => `
                  <li>
                    <a href="/category/${cat.slug}" class="mobile-nav-link">
                      ${cat.name}
                    </a>
                  </li>
                `).join('')}
              </ul>
            </li>
          `;
        }).join('')}
        <li class="mobile-nav-divider"></li>
        <li><a href="/" class="mobile-nav-link">Home</a></li>
        <li><a href="/category/quick-and-easy" class="mobile-nav-link">Quick &amp; Easy</a></li>
        <li><a href="/edit.html" class="mobile-nav-link mobile-nav-create">
          <i class="fa fa-plus"></i> Create Recipe
        </a></li>
      </ul>
    `;

    mobileNav.innerHTML = html;

    // Wire accordion
    mobileNav.querySelectorAll('.mobile-nav-group-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const isOpen = btn.getAttribute('aria-expanded') === 'true';
        const sublist = document.getElementById(btn.getAttribute('aria-controls'));

        // Close all others
        mobileNav.querySelectorAll('.mobile-nav-group-btn').forEach(other => {
          other.setAttribute('aria-expanded', 'false');
          other.querySelector('i').className = 'fa fa-chevron-right';
          const otherId = other.getAttribute('aria-controls');
          document.getElementById(otherId)?.setAttribute('hidden', '');
        });

        // Toggle this one
        if (!isOpen) {
          btn.setAttribute('aria-expanded', 'true');
          btn.querySelector('i').className = 'fa fa-chevron-down';
          sublist?.removeAttribute('hidden');
        }
      });
    });

    // Close nav when a link is clicked
    mobileNav.querySelectorAll('.mobile-nav-link').forEach(link => {
      link.addEventListener('click', () => {
        const toggle = document.getElementById('menu-toggle');
        if (toggle) toggle.click();
      });
    });

  } catch (error) {
    console.error('Failed to build mobile nav:', error);
  }
}