// Environment configuration for API endpoints
const ENV = {
  // Automatically detect the environment
  isProduction: window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1',
  
  // Check if running on Netlify
  isNetlify: window.location.hostname.includes('netlify.app') || window.location.hostname.includes('.netlify.com'),
  
  // Check if running on GitHub Pages
  isGitHubPages: window.location.hostname.includes('github.io'),
  
  // API Base URL - update this with your deployed backend URL
  getApiUrl() {
    // If running locally, use localhost
    if (!this.isProduction) {
      return 'http://localhost:3000';
    }
    
    // If running on Netlify, use Render backend
    if (this.isNetlify) {
      return 'https://talkemon.onrender.com';
    }
    
    // If running on GitHub Pages, use Render backend
    if (this.isGitHubPages) {
      return 'https://talkemon.onrender.com';
    }
    
    // Default: try same origin first
    return window.location.origin;
  },
  
  // Get full API endpoint
  getEndpoint(path) {
    const baseUrl = this.getApiUrl();
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  }
};

// Export for use in other files
window.ENV = ENV;
