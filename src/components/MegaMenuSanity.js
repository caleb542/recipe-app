/**
 * MEGA MENU - SANITY NAV PATTERN
 * Measures content, sets box dimensions dynamically
 */
export async function buildNav() {
  try {
    const res = await fetch('/.netlify/functions/get-categories');
    const { grouped } = await res.json();

    const navList = document.getElementById('nav-list');
    if (!navList) return;

    const activeGroups = Object.entries(grouped).filter(([group, cats]) =>
      cats.some(cat => cat.recipeCount > 0)
    );

    const dropdownHTML = activeGroups.map(([group, cats]) => {
      const activeCats = cats.filter(cat => cat.recipeCount > 0);
      const groupId = group.toLowerCase() + '-menu';

      // Sub-group by sectionTitle
      const sections = activeCats.reduce((acc, cat) => {
        const title = cat.sectionTitle || group;
        if (!acc[title]) acc[title] = [];
        acc[title].push(cat);
        return acc;
      }, {});

      const sectionsHTML = Object.entries(sections).map(([sectionTitle, sectionCats]) => `
        <div class="mega-panel-section">
          <h3 class="mega-section-title">${sectionTitle}</h3>
          <ul class="mega-link-list">
            ${sectionCats.map(cat => `
              <li>
                <a href="/category/${cat.slug}" class="mega-link">
                  <span class="mega-link-title">${cat.name}</span>
                  ${cat.description ? `<span class="mega-link-desc">${cat.description}</span>` : ''}
                </a>
              </li>
            `).join('')}
          </ul>
        </div>
      `).join('');

      return `
        <li class="nav-item has-dropdown" data-open="false">
          <button
            class="nav-link"
            aria-expanded="false"
            aria-controls="${groupId}"
            aria-haspopup="true"
          >
            ${group} <i class="fa fa-chevron-down"></i>
          </button>
          <div id="${groupId}" class="mega-menu-panel">
            <div class="mega-panel-grid">
              ${sectionsHTML}
            </div>
          </div>
        </li>
      `;
    }).join('');

    navList.insertAdjacentHTML('afterbegin', dropdownHTML);

  } catch (error) {
    console.error('Failed to build nav:', error);
  }
}

/**
 * Setup mega menu interactions
 */
export function setupSanityMegaMenu() {
  const navBar = document.querySelector('.nav-bar');
  const navList = document.querySelector('.nav-list');
  const navItems = document.querySelectorAll('.nav-item.has-dropdown');
  const panels = document.querySelectorAll('.mega-menu-panel');
  const box = document.querySelector('.mega-menu-box');
  const backdrop = document.querySelector('.mega-menu-backdrop');

  if (!navItems.length) {
    console.warn('NavItems not found');
    return;
  }
  
  if (!box) {
    console.warn('Box not found');
    return;
  }

  // Nested function to measure panels
  function getMeasurements() {
    panels.forEach((panel) => {
      panel.style.display = 'grid';
      panel.style.visibility = 'hidden';
      
      panel.setAttribute('data-width', panel.offsetWidth + 140);
      panel.setAttribute('data-height', panel.offsetHeight);
      
      console.log(`Panel ${panel.id}: ${panel.offsetWidth}x${panel.offsetHeight}`);
    });
  }

  // Helper function to close all menus
  function closeAllMenus() {
    navItems.forEach(item => {
      if (item.getAttribute('data-open') === 'true') {
        item.setAttribute('data-open', 'false');
        item.classList.add('leaving');
        
        const button = item.querySelector('.nav-link[aria-controls]');
        const panelId = button?.getAttribute('aria-controls');
        const panel = document.getElementById(panelId);
        
        if (panel) {
          panel.classList.remove('is-active');
          panel.style.visibility = 'hidden';
        }
        
        box.style.width = '0';
        box.style.height = '0';
        // box.style.transition = 'all 0.25s ease-in';

        // Remove class after transition completes
      
          box.classList.remove('is-active');
          if (panel) {
            panel.classList.remove('is-active');
          }
      
        backdrop.classList.remove('is-visible');
        button?.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Measure all panels on init
  getMeasurements();
function openPanel(item, button, panelId) {
  getMeasurements();
  const panel = document.getElementById(panelId);
  if (!panel) return;
  
  const w = panel.getAttribute('data-width');
  const h = panel.getAttribute('data-height');
  
  item.setAttribute('data-open', 'true');
  item.classList.remove('leaving');
  panel.style.visibility = 'visible';
  panel.style.zIndex = '1';
  panel.classList.add('is-active');
  
  box.classList.add('is-active');
  box.style.width = `${Math.max(w, navBar.offsetWidth)}px`;
  box.style.height = `${Math.max(h, 400)}px`;
  
  backdrop.classList.add('is-visible');
  button.setAttribute('aria-expanded', 'true');
}

  navItems.forEach((item) => {
    const button = item.querySelector('.nav-link[aria-controls]');
    const panelId = button?.getAttribute('aria-controls');
    
    if (!button || !panelId) return;

    // Mouse enter - open menu
    let hoverTimer;

item.addEventListener('mouseenter', (e) => {
  clearTimeout(hoverTimer);
  const anyOpen = Array.from(navItems).some(i => i.getAttribute('data-open') === 'true');
  if (!anyOpen) return;
  if (item.getAttribute('data-open') === 'true') return;
  
  hoverTimer = setTimeout(() => {
    // Close sibling panels only — don't touch the box
    navItems.forEach(otherItem => {
      if (otherItem !== item) {
        otherItem.setAttribute('data-open', 'false');
        const otherButton = otherItem.querySelector('.nav-link[aria-controls]');
        const otherPanelId = otherButton?.getAttribute('aria-controls');
        const otherPanel = document.getElementById(otherPanelId);
        if (otherPanel) {
          otherPanel.classList.remove('is-active');
          otherPanel.style.visibility = 'hidden';
        }
        otherButton?.setAttribute('aria-expanded', 'false');
      }
    });
    openPanel(item, button, panelId);
  }, 150);
});

item.addEventListener('mouseleave', () => {
  clearTimeout(hoverTimer);
});

    // Focus in (keyboard navigation)
item.addEventListener('focusin', (e) => {
  // ✅ Close ALL other menus first (same as mouseenter)
  navItems.forEach(otherItem => {
    if (otherItem !== item && otherItem.getAttribute('data-open') === 'true') {
      otherItem.setAttribute('data-open', 'false');
      otherItem.classList.add('leaving');
      
      const otherButton = otherItem.querySelector('.nav-link[aria-controls]');
      const otherPanelId = otherButton?.getAttribute('aria-controls');
      const otherPanel = document.getElementById(otherPanelId);
      
      if (otherPanel) {
        otherPanel.classList.remove('is-active');
        otherPanel.style.visibility = 'hidden';
      }
      
      otherButton?.setAttribute('aria-expanded', 'false');
    }
  });

  // Don't re-open if already open
  if (item.getAttribute('data-open') === 'true') return;

  item.setAttribute('data-open', 'true');
  item.classList.remove('leaving');
  
  getMeasurements();
  
  const panel = document.getElementById(panelId);
  if (!panel) return;
  
  const w = panel.getAttribute('data-width');
  const h = panel.getAttribute('data-height');
  
  panel.style.visibility = 'visible';
  panel.style.zIndex = '1';
  panel.classList.add('is-active');
  
  box.classList.add('is-active');
  box.style.width = `${Math.max(w, navBar.offsetWidth)}px`;
  box.style.height = `${Math.max(h, 400)}px`;
  // box.style.transition = 'all 0.2s';
  
  backdrop.classList.add('is-visible');
  button.setAttribute('aria-expanded', 'true');
});

 // Focus out (keyboard navigation)
item.addEventListener('focusout', (e) => {
  // Check if focus is still within this nav item (after browser updates)
  setTimeout(() => {
    const focusedElement = document.activeElement;
    
    // Don't close if focus moved to another nav button
    const isOnAnotherNavButton = Array.from(navItems).some(navItem => 
      navItem.contains(focusedElement)
    );
    
    // Only close if focus completely left the mega menu system
    if (!item.contains(focusedElement) && !isOnAnotherNavButton) {
      closeAllMenus();
    }
  }, 0);
});

    // Click handler
    button.addEventListener('click', (e) => {
      e.preventDefault();
      
      const isOpen = item.getAttribute('data-open') === 'true';
      
      if (isOpen) {
      
      } else {
        closeAllMenus();
        openPanel(item, button, panelId);
      }
    });
  });

  // Close when leaving entire nav bar
  navBar.addEventListener('mouseleave', () => {
    closeAllMenus();
  });

  // Close on backdrop click
  backdrop.addEventListener('click', () => {
    closeAllMenus();
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllMenus();
    }
  });

  // Close when clicking links
  panels.forEach(panel => {
    panel.querySelectorAll('.mega-link').forEach(link => {
      link.addEventListener('click', () => {
        navItems.forEach(item => {
          item.setAttribute('data-open', 'false');
          const button = item.querySelector('.nav-link[aria-controls]');
          const panelId = button?.getAttribute('aria-controls');
          const p = document.getElementById(panelId);
          
          if (p) {
            p.classList.remove('is-active');
            p.style.visibility = 'hidden';
          }
          button?.setAttribute('aria-expanded', 'false');
        });
        
        // Instant hide, no transition
        box.style.transition = 'none';
        box.classList.remove('is-active');
        box.style.width = '0';
        box.style.height = '0';
        backdrop.classList.remove('is-visible');
        
        // Page will navigate, no need for smooth close
      });
    });
  });

  console.log('✓ Sanity mega menu setup');
}

/**
 * Programmatic control
 */
export function openMegaMenu(panelId) {
  const item = document.querySelector(`[aria-controls="${panelId}"]`)?.closest('.nav-item');
  if (item) {
    item.dispatchEvent(new Event('mouseenter'));
  }
}

export function closeMegaMenu() {
  const navItems = document.querySelectorAll('.nav-item.has-dropdown');
  const box = document.querySelector('.mega-menu-box');
  const backdrop = document.querySelector('.mega-menu-backdrop');
  
  navItems.forEach(item => {
    item.setAttribute('data-open', 'false');
    item.classList.add('leaving');
    
    const button = item.querySelector('.nav-link[aria-controls]');
    const panelId = button?.getAttribute('aria-controls');
    const panel = document.getElementById(panelId);
    
    if (panel) {
      panel.classList.remove('is-active');
      panel.style.visibility = 'hidden';
    }
    
    button?.setAttribute('aria-expanded', 'false');
  });
  
  if (box) {
    box.classList.remove('is-active');
    box.style.width = '0';
    box.style.height = '0';
  }
  
  if (backdrop) {
    backdrop.classList.remove('is-visible');
  }
}