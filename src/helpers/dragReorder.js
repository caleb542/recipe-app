// src/helpers/dragReorder.js

/**
 * Enable drag-and-drop reordering on a list of items within a container.
 * Generic over item type — works for images, ingredients, directions, or
 * any list of DOM elements with a stable ID in a data attribute.
 *
 * @param {string} itemSelector - CSS selector for draggable items (e.g. '.image-card', '.direction-row')
 * @param {string} dataAttr - camelCase dataset key holding the item's stable ID (e.g. 'imageId', 'stepId')
 * @param {(newOrderIds: string[]) => Promise<void>} onReorder - called with ordered IDs after a drop
 */
export function setupDragReorder(itemSelector, dataAttr, onReorder) {
  const items = document.querySelectorAll(itemSelector);
  let draggedElement = null;

  items.forEach(item => {
    item.addEventListener('dragstart', () => {
      draggedElement = item;
      item.classList.add('dragging');
    });

    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
    });

    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      const afterElement = getDragAfterElement(item.parentElement, itemSelector, e.clientY);
      if (afterElement == null) {
        item.parentElement.appendChild(draggedElement);
      } else {
        item.parentElement.insertBefore(draggedElement, afterElement);
      }
    });

    item.addEventListener('drop', async (e) => {
      e.preventDefault();
      const newOrder = Array.from(document.querySelectorAll(itemSelector))
        .map(el => el.dataset[dataAttr]);
      await onReorder(newOrder);
    });
  });
}

/**
 * Determine which element the dragged item should be inserted before,
 * based on vertical mouse position. Returns null if the dragged item
 * should go at the end of the list.
 */
function getDragAfterElement(container, itemSelector, y) {
  const draggableElements = [...container.querySelectorAll(`${itemSelector}:not(.dragging)`)];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;

    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}