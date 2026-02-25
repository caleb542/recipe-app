import { updateLocalStorage } from '../functions.js';

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
                label: 'Telegram',
                icon: 'fa-brands fa-telegram',
                action: () => window.open(`https://t.me/share/url?text=${encoded}`, '_blank')
            },
            {
                label: 'SMS',
                icon: 'fa-solid fa-comment-sms',
                action: () => window.location.href = `sms:?body=${encoded}`
            },
            {
                label: 'Copy to Clipboard',
                icon: 'fa-solid fa-copy',
                action: async () => {
                    await navigator.clipboard.writeText(text);
                    notyf?.success('Copied to clipboard!');
                    document.querySelector('.share-popover')?.remove();
                }
            }
        ];

        const popover = document.createElement('div');
        popover.className = 'share-popover';

        options.forEach(({ label, icon, action }) => {
            const btn = document.createElement('button');
            btn.innerHTML = `<i class="fa ${icon}"></i> ${label}`;
            btn.addEventListener('click', () => {
                action();
                popover.remove();
            });
            popover.appendChild(btn);
        });

        setTimeout(() => {
            document.addEventListener('click', function handler(e) {
                if (!popover.contains(e.target)) {
                    popover.remove();
                    document.removeEventListener('click', handler);
                }
            });
        }, 0);

        anchorEl.appendChild(popover);
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
        moreBtn.innerHTML = `<i class="fa fa-solid fa-ellipsis"></i> <span>More options</span>`;
        moreBtn.addEventListener('click', () => showSharePopover(recipeName, moreBtn));

        list.appendChild(shareBtn);
        list.appendChild(moreBtn);
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