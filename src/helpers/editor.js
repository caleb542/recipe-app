import Editor from '@toast-ui/editor';
import TurndownService from 'turndown';
import { updateLocalStorage } from '../functions.js';

const turndownService = new TurndownService();

function setupEditor(recipeId, rawHTML) {
  const markdown = turndownService.turndown(rawHTML);

  const toastEditor = new Editor({
    el: document.querySelector('#editor'),
    height: '400px',
    initialEditType: 'markdown',
    previewStyle: 'vertical',
    initialValue: markdown,
    hooks: {
      change: () => {
        // const recipeId = location.hash.substring(1); Commented out because = unnecessary
        updateLocalStorage(recipeId, { article: toastEditor.getMarkdown() });
      }
    }
  });

  window.toastEditor = toastEditor;
  return toastEditor;
}

export { setupEditor };
