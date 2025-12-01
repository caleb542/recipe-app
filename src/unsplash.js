const getImageGroup = async (keyword, page = 1) => {
  try {
    const res = await fetch(`/.netlify/functions/unsplashConnect?query=${encodeURIComponent(keyword)}&page=${page}`);
    const data = await res.json();

    if (data.error) {
      console.error("❌ Unsplash error:", data.details);
      return [];
    }

    return data;
  } catch (err) {
    console.error("❌ Failed to parse Unsplash response:", err);
    return [];
  }
};


const unsplashme = async (keyword) => {
  const images = await getImageGroup(keyword, 1);
  if (!images.length) return null;

  const random = Math.floor(Math.random() * Math.min(images.length, 15));
  const photo = images[random];

  return {
    photoSmallUrl: photo.urls.small,
    photoThumbnail: photo.urls.thumb,
    photographer: photo.user.name,
    photographerLink: photo.user.links.html,
  };
};

export { unsplashme, getImageGroup };
