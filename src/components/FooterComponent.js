// src/components/FooterComponent.js
// Reusable footer component for all pages

export async function loadFooter() {
  const footerContainer = document.getElementById('footer-container');
  
  if (!footerContainer) {
    console.warn('Footer container not found');
    return;
  }

  const currentYear = new Date().getFullYear();
  
  footerContainer.innerHTML = `
    <footer class="site-footer">
      <div class="footer-content">
        <div class="footer-section">
          <h4>Recipe Me</h4>
          <p class="footer-tagline">A portfolio project by Caleb</p>
          <p class="footer-disclaimer">
            This is a demonstration project showcasing web development skills. 
            Not intended for production use.
          </p>
        </div>
        
        <div class="footer-section">
          <h4>Quick Links</h4>
          <ul class="footer-links">
            <li><a href="/">Home</a></li>
            <li><a href="/edit.html">Create Recipe</a></li>
            <li><a href="https://github.com/caleb542/recipe-app" target="_blank" rel="noopener">
              <i class="fa-brands fa-github"></i> View on GitHub
            </a></li>
          </ul>
        </div>
        
        <div class="footer-section">
          <h4>Tech Stack</h4>
          <ul class="footer-tech">
            <li>Vanilla JS + Webpack</li>
            <li>MongoDB Atlas</li>
            <li>Netlify Functions</li>
            <li>Auth0</li>
            <li>Cloudinary</li>
          </ul>
        </div>
      </div>
      
      <div class="footer-bottom">
        <p>&copy; ${currentYear} Recipe Me Portfolio Project</p>
        <p class="footer-note">
          Stock photos via <a href="https://unsplash.com/?utm_source=recipe_me&utm_medium=referral" target="_blank" rel="noopener">Unsplash</a> • User uploads via Cloudinary
        </p>
      </div>
    </footer>
  `;
}