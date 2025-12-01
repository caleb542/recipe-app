// helpers/shoppingList.js
import { updateLocalStorage } from '../functions.js';

export function setupShoppingList(recItem, recipeId, your_email) {
  const checkboxes = document.querySelectorAll('.checklist li input');
  const list = document.querySelector('.shopping-list');
  const shoppingListArr = [];

  function updateMailtoLink(recipeName) {
    const mailto = document.getElementById('mail-list');
    if (!mailto) return;
    const bodyString = shoppingListArr.map(item => `${item}%0D%0A`).join('');
    mailto.setAttribute(
      'href',
      `mailto:${your_email}?&subject=Shopping list for ${recipeName}&body=${bodyString}`
    );
  }

  function renderShoppingList(recipeName) {
    list.innerHTML = '';

    shoppingListArr.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      list.appendChild(li);
    });

    let mailto = document.getElementById('mail-list');
    if (!mailto && shoppingListArr.length > 0) {
      mailto = document.createElement('a');
      mailto.classList.add('mailto');
      mailto.id = 'mail-list';
      mailto.title = 'Email Shopping List';

      const span = document.createElement('span');
      span.classList.add('hide-text');
      const icon = document.createElement('i');
      icon.classList.add('fa','fa-solid','fa-envelope');

      mailto.append(span, icon);
      list.appendChild(mailto);
    }

    if (shoppingListArr.length === 0) {
      document.querySelector('.shoppinglist-container').classList.add('hide');
      if (mailto) mailto.remove();
    } else {
      document.querySelector('.shoppinglist-container').classList.remove('hide');
      document.querySelector('.checklist-container').classList.add('checked');
      updateMailtoLink(recipeName);
      list.appendChild(mailto);
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