// src/helpers/videoHelper.js
import { extractYouTubeId, extractVimeoId } from './youtubeEmbed.js';

/**
 * Setup video helper UI in edit page
 */
export function setupVideoHelper(editorInstance) {
  const addVideoBtn = document.getElementById('add-video-btn');
  const videoUrlInput = document.getElementById('quick-video-url');
  
  if (!addVideoBtn || !videoUrlInput) return;

  addVideoBtn.addEventListener('click', () => {
    const url = videoUrlInput.value.trim();
    
    if (!url) {
      alert('Please paste a YouTube or Vimeo URL');
      return;
    }

    // Validate URL
    const youtubeId = extractYouTubeId(url);
    const vimeoId = extractVimeoId(url);
    
    if (!youtubeId && !vimeoId) {
      alert('❌ Invalid video URL. Please use a YouTube or Vimeo link.');
      return;
    }

    // Insert URL into editor
    if (editorInstance) {
      // Toast UI Editor
      const currentContent = editorInstance.getMarkdown();
      const newContent = currentContent + `\n\n${url}\n\n`;
      editorInstance.setMarkdown(newContent);
    } else {
      // Fallback: Plain textarea
      const textarea = document.getElementById('article-textarea');
      if (textarea) {
        textarea.value += `\n\n${url}\n\n`;
      }
    }

    // Clear input and show success
    videoUrlInput.value = '';
    showVideoSuccess(youtubeId ? 'YouTube' : 'Vimeo');
  });

  // Enter key support
  videoUrlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addVideoBtn.click();
    }
  });
}

/**
 * Show success message
 */
function showVideoSuccess(platform) {
  const btn = document.getElementById('add-video-btn');
  const originalText = btn.innerHTML;
  
  btn.innerHTML = `<i class="fa-solid fa-check"></i> ${platform} Video Added!`;
  btn.style.background = '#2ecc71';
  
  setTimeout(() => {
    btn.innerHTML = originalText;
    btn.style.background = '';
  }, 2000);
}