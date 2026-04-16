import { updateLocalStorage } from '../functions.js';


import { Notyf } from 'notyf';
let notyf = new Notyf({
    duration: 2000,
    position: { x: 'right', y: 'bottom' },
    
});




export function setupShoppingList(recItem, recipeId) {
    const checkboxes = document.querySelectorAll('.checklist li input');
    const list = document.querySelector('.shopping-list');
    const shoppingListArr = [];

    function getShareText(recipeName) {
        return `Shopping list for ${recipeName}:\n\n` + shoppingListArr.join('\n');
    }

function showSharePopover(recipeName, anchorEl) {
  document.querySelector('.share-popover')?.remove();

  const text = getShareText(recipeName);
  const subject = encodeURIComponent(`Shopping list for ${recipeName}`);
  const body = encodeURIComponent(text);
  const encoded = encodeURIComponent(text);

  const options = [
  {
    label: 'Copy to Clipboard',
    icon: 'fa-solid fa-copy',
    action: async () => {
      await navigator.clipboard.writeText(text);
      notyf.success("Copied to clipboard!");
      console.log('notyf:', notyf.success);
      document.querySelector('.share-popover')?.remove();
    }
  },
  {
    label: 'Gmail',
    icon: 'fa-brands fa-google',
    action: () => window.open(`https://mail.google.com/mail/?view=cm&su=${subject}&body=${body}`, '_blank')
  },
  {
    label: 'Default Mail App',
    icon: 'fa-solid fa-envelope',
    action: () => window.location.href = `mailto:?subject=${subject}&body=${body}`
  },
  {
    label: 'WhatsApp',
    icon: 'fa-brands fa-whatsapp',
    action: () => window.open(`https://wa.me/?text=${encoded}`, '_blank')
  },
  {
    label: 'SMS',
    icon: 'fa-solid fa-comment-sms',
    action: () => window.location.href = `sms:?body=${encoded}`
  }
];

  const popover = document.createElement('div');
  popover.className = 'share-popover';
  popover.setAttribute('role', 'dialog');
  popover.setAttribute('aria-label', 'Sharing options');


  options.forEach(({ label, icon, action }) => {
    const btn = document.createElement('button');
    btn.innerHTML = `<i class="${icon}"></i> ${label}`;
    btn.addEventListener('click', () => {
      action();
      popover.remove();
    });
    popover.appendChild(btn);
  });

  // Position relative to anchor button
const rect = anchorEl.getBoundingClientRect();
popover.style.position = 'fixed';
popover.style.visibility = 'hidden';
popover.style.zIndex = '9999';
popover.style.left = `${rect.left}px`;
document.body.appendChild(popover);

document.body.appendChild(popover);

// Move focus to first button
requestAnimationFrame(() => {
  popover.querySelector('button')?.focus();
});

const popoverRect = popover.getBoundingClientRect();
const spaceBelow = window.innerHeight - rect.bottom;

if (spaceBelow >= popoverRect.height + 8) {
  popover.style.top = `${rect.bottom + 8}px`;
} else {
  popover.style.top = `${rect.top - popoverRect.height - 8}px`;
}

const rightEdge = rect.left + popoverRect.width;
if (rightEdge > window.innerWidth) {
  popover.style.left = `${window.innerWidth - popoverRect.width - 16}px`;
}

popover.style.visibility = 'visible';

// Remove the setTimeout click handler and replace with:
popover.addEventListener('focusout', (e) => {
  setTimeout(() => {
    if (!popover.contains(document.activeElement)) {
      popover.remove();
      window.removeEventListener('scroll', scrollHandler);
    }
  }, 0);
});

  const scrollHandler = () => {
    popover.remove();
    window.removeEventListener('scroll', scrollHandler);
    };

 window.addEventListener('scroll', scrollHandler, { passive: true });

  
}

    async function handleShare(recipeName) {
        const shareBtn = document.getElementById('share-list');

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Shopping list for ${recipeName}`,
                    text: getShareText(recipeName)
                });
            } catch (err) {
                if (err.name !== 'AbortError') showSharePopover(recipeName, shareBtn);
            }
        } else {
            showSharePopover(recipeName, shareBtn);
        }
    }

function renderShoppingList(recipeName) {

    list.innerHTML = '';

    // Always remove existing buttons
            document.getElementById('share-list')?.remove();
        document.getElementById('share-list-more')?.remove();
        document.getElementById('share-button-container')?.remove();

    shoppingListArr.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        list.appendChild(li);
    });

    if (shoppingListArr.length === 0) {
        document.querySelector('.shoppinglist-container').classList.add('hide');
    } else {
        document.querySelector('.shoppinglist-container').classList.remove('hide');
        document.querySelector('.checklist-container').classList.add('checked');

        const shareBtn = document.createElement('button');
        shareBtn.classList.add('share-btn');
        shareBtn.id = 'share-list';
        shareBtn.title = 'Share Shopping List';
        shareBtn.innerHTML = `<i class="fa fa-solid fa-share-nodes"></i> <span>Share List</span>`;
        shareBtn.addEventListener('click', () => handleShare(recipeName));

        const moreBtn = document.createElement('button');
        moreBtn.classList.add('share-btn', 'share-btn--more');
        moreBtn.id = 'share-list-more';
        moreBtn.title = 'More sharing options';
        moreBtn.innerHTML = `<i class="fa fa-solid fa-ellipsis"></i> <span>More sharing options</span>`;
        moreBtn.addEventListener('click', () => showSharePopover(recipeName, moreBtn));

        const container = document.querySelector('.shoppinglist-container');
        
        const shareButtonContainer = document.createElement("div");
        shareButtonContainer.id = 'share-button-container';
        shareButtonContainer.classList.add("share-button-container");
        container.appendChild(shareButtonContainer);
        shareButtonContainer.appendChild(shareBtn);
        shareButtonContainer.appendChild(moreBtn);

    }
}

    checkboxes.forEach(item => {
        item.addEventListener('change', () => {
            const text = item.parentNode.childNodes[1].textContent;

            if (item.checked) {
                shoppingListArr.push(text);
            } else {
                const index = shoppingListArr.indexOf(text);
                if (index > -1) shoppingListArr.splice(index, 1);
            }

            renderShoppingList(recItem.name);
        });
    });
}