// Environment Configuration
const ENV_CONFIG = {
    development: {
        apiBaseUrl: 'http://localhost:3000',
        isDevelopment: true
    },
    production: {
        apiBaseUrl: 'https://your-production-domain.com',
        isDevelopment: false
    }
};

// Auto-detect environment
const isLocalhost = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' ||
                    window.location.hostname === '';

const currentEnv = isLocalhost ? 'development' : 'production';
const config = ENV_CONFIG[currentEnv];

// Export configuration
window.APP_CONFIG = {
    API_BASE_URL: config.apiBaseUrl,
    IS_DEVELOPMENT: config.isDevelopment,
    ENV: currentEnv
};

console.log(`🚀 App running in ${currentEnv} mode`);
console.log(`📡 API Base URL: ${config.apiBaseUrl}`);
