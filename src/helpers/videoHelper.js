import { v4 as uuidv4 } from 'uuid';
import { loadRecipesFromLocalStorage } from '../functions.js';
import { syncRecipeUpdate } from './syncRecipe.js';
import { extractYouTubeId, extractVimeoId } from './youtubeEmbed.js';

let _activeVideoId = null;
let _currentRecipeId = null;

/**
 * Render all videos for a given recipe
 */
async function listVideos(recipeId) {
  const container = document.querySelector('#video-list');
  if (!container) return;

  _currentRecipeId = recipeId;
  container.innerHTML = '';

  const recipes = await loadRecipesFromLocalStorage();
  const recipe = recipes.find(r => r.id === recipeId);
  const videos = recipe?.videos || [];

  if (videos.length === 0) {
    container.innerHTML = '<p class="video-list-empty">No videos added yet.</p>';
    return;
  }

  videos.forEach(video => {
    container.appendChild(renderVideoItem(video));
  });
}

/**
 * Render a single video row
 */
function renderVideoItem(video) {
  const li = document.createElement('li');
  li.className = 'video-item';
  li.dataset.id = video.id;

  const isYoutube = extractYouTubeId(video.url);
  const icon = isYoutube
    ? '<i class="fa-brands fa-youtube"></i>'
    : '<i class="fa-brands fa-vimeo"></i>';

  li.innerHTML = `
    <span class="video-item-icon">${icon}</span>
    <span class="video-item-url">${video.url || 'No URL'}</span>
    <button class="item-buttons edit-video" data-id="${video.id}">
      <i class="fa fa-pencil"></i> Edit
    </button>
    <button class="item-buttons remove-video" data-id="${video.id}">
      <i class="fa fa-trash-can"></i> Delete
    </button>
  `;
  return li;
}

/**
 * Setup the single URL input listener
 * Fires once when the video modal opens
 */
function setupVideoInput(recipeId) {
  const input = document.getElementById('quick-video-url');
  if (!input || input.dataset.bound) return;

  input.dataset.bound = 'true';

  input.addEventListener('input', async e => {
    const val = e.target.value.trim();
    const youtubeId = extractYouTubeId(val);
    const vimeoId = extractVimeoId(val);

    if (!val || (!youtubeId && !vimeoId)) return;
    if (!_activeVideoId) return;

    await syncRecipeUpdate(recipeId, recipe => {
      recipe.videos = (recipe.videos || []).map(v =>
        v.id === _activeVideoId ? { ...v, url: val } : v
      );
    });

    await listVideos(recipeId);
  });
}

/**
 * Delegated listener for edit/remove buttons in the list
 */
function setupVideoDelegation(recipeId) {
  const container = document.querySelector('#video-list');
  if (!container || container.dataset.bound) return;
  container.dataset.bound = 'true';

  container.addEventListener('click', async e => {
    const removeBtn = e.target.closest('button.remove-video');
    const editBtn = e.target.closest('button.edit-video');

    if (removeBtn) {
      const id = removeBtn.dataset.id;
      if (confirm('Remove this video?')) {
        await removeVideo(recipeId, id);
      }
    }

    if (editBtn) {
      const id = editBtn.dataset.id;
      _activeVideoId = id;

      // Load current URL into input
      const recipes = await loadRecipesFromLocalStorage();
      const recipe = recipes.find(r => r.id === recipeId);
      const video = recipe?.videos?.find(v => v.id === id);

      const input = document.getElementById('quick-video-url');
      if (input && video) {
        input.value = video.url || '';
        input.focus();
      }
    }
  });
}

/**
 * Add a new video entry and set it as active
 */
async function addVideo(recipeId) {
  const newVideo = {
    id: uuidv4(),
    url: '',
    order: 0
  };

  await syncRecipeUpdate(recipeId, recipe => {
    if (!recipe.videos) recipe.videos = [];
    newVideo.order = recipe.videos.length;
    recipe.videos.push(newVideo);
  });

  _activeVideoId = newVideo.id;

  const input = document.getElementById('quick-video-url');
  if (input) {
    input.value = '';
    input.focus();
  }

  await listVideos(recipeId);
}

/**
 * Remove video by ID
 */
async function removeVideo(recipeId, id) {
  await syncRecipeUpdate(recipeId, recipe => {
    recipe.videos = (recipe.videos || []).filter(v => v.id !== id);
    recipe.videos.forEach((v, i) => v.order = i);
  });

  if (_activeVideoId === id) _activeVideoId = null;
  await listVideos(recipeId);
}

export {
  listVideos,
  setupVideoDelegation,
  setupVideoInput,
  addVideo,
  removeVideo
};