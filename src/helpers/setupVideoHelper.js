// In edit.js or editor setup
export function setupVideoHelper() {
  const videoBtn = document.createElement('button');
  videoBtn.textContent = '📹 Add Video';
  videoBtn.className = 'editor-tool-btn';
  videoBtn.type = 'button';
  
  videoBtn.addEventListener('click', () => {
    const url = prompt('Paste your YouTube video URL:');
    
    if (url) {
      const videoId = extractYouTubeId(url);
      
      if (videoId) {
        // Insert URL into editor (will auto-embed on display)
        insertIntoEditor(`\n\n${url}\n\n`);
        alert('✅ Video added! It will appear in your recipe.');
      } else {
        alert('❌ Invalid YouTube URL. Please check and try again.');
      }
    }
  });
  
  // Add button to editor toolbar
  const toolbar = document.querySelector('.editor-toolbar');
  if (toolbar) {
    toolbar.appendChild(videoBtn);
  }
}