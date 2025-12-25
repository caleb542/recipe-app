// src/helpers/youtubeEmbed.js

/**
 * Auto-embed YouTube videos (WordPress-style)
 * Detects YouTube URLs and converts them to iframes
 * @param {string} html - Article HTML content
 * @returns {string} - HTML with embedded videos
 */
export function autoEmbedYouTube(html) {
  // YouTube URL patterns
  const patterns = [
    // https://www.youtube.com/watch?v=VIDEO_ID
    /https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})(?:[&\?][^\s<]*)?/gi,
    
    // https://youtu.be/VIDEO_ID
    /https?:\/\/youtu\.be\/([a-zA-Z0-9_-]{11})(?:[&\?][^\s<]*)?/gi,
    
    // https://www.youtube.com/embed/VIDEO_ID
    /https?:\/\/(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})(?:[&\?][^\s<]*)?/gi,
    
    // https://youtube.com/shorts/VIDEO_ID
    /https?:\/\/(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})(?:[&\?][^\s<]*)?/gi
  ];

  let result = html;

  patterns.forEach(pattern => {
    result = result.replace(pattern, (match, videoId) => {
      // Don't replace if already in an <a> tag or <iframe>
      const beforeMatch = result.substring(Math.max(0, result.indexOf(match) - 100), result.indexOf(match));
      if (/<a[^>]*>(?!.*<\/a>)|<iframe[^>]*>(?!.*<\/iframe>)/i.test(beforeMatch)) {
        return match;
      }

      return createYouTubeEmbed(videoId);
    });
  });

  return result;
}

/**
 * Auto-embed Vimeo videos
 * @param {string} html - Article HTML content
 * @returns {string} - HTML with embedded videos
 */
export function autoEmbedVimeo(html) {
  const pattern = /https?:\/\/(?:www\.)?vimeo\.com\/(\d+)(?:[^\s<]*)?/gi;
  
  return html.replace(pattern, (match, videoId) => {
    return createVimeoEmbed(videoId);
  });
}

/**
 * Auto-embed all supported video platforms
 * @param {string} html - Article HTML content
 * @returns {string} - HTML with embedded videos
 */
export function autoEmbedVideos(html) {
  let result = autoEmbedYouTube(html);
  result = autoEmbedVimeo(result);
  return result;
}

/**
 * Create YouTube embed iframe
 * @param {string} videoId - YouTube video ID
 * @returns {string} - Iframe HTML
 */
function createYouTubeEmbed(videoId) {
  return `
    <div class="video-embed youtube-embed">
      <iframe 
        src="https://www.youtube-nocookie.com/embed/${videoId}" 
        frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
        allowfullscreen
        loading="lazy"
        title="YouTube video player"
      ></iframe>
    </div>
  `;
}

/**
 * Create Vimeo embed iframe
 * @param {string} videoId - Vimeo video ID
 * @returns {string} - Iframe HTML
 */
function createVimeoEmbed(videoId) {
  return `
    <div class="video-embed vimeo-embed">
      <iframe 
        src="https://player.vimeo.com/video/${videoId}" 
        frameborder="0" 
        allow="autoplay; fullscreen; picture-in-picture" 
        allowfullscreen
        loading="lazy"
        title="Vimeo video player"
      ></iframe>
    </div>
  `;
}

/**
 * Extract video ID from YouTube URL
 * @param {string} url - YouTube URL
 * @returns {string|null} - Video ID or null
 */
export function extractYouTubeId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * Extract video ID from Vimeo URL
 * @param {string} url - Vimeo URL
 * @returns {string|null} - Video ID or null
 */
export function extractVimeoId(url) {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
}