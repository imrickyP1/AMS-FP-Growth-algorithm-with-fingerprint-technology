// ===============================================
// 🔧 CENTRALIZED API CONFIGURATION
// ===============================================
// This file contains the API base URL for all frontend requests
// Switch between Node.js (5005) and .NET Core 9 (5002) API

// ✅ CONFIGURATION: Choose your API backend
const API_CHOICE = {
  // Use 'nodejs' for Node.js Express backend (port 5005)
  // Use 'netcore9' for .NET Core 9 backend (port 5002)
  backend: 'netcore9'
};

// API URLs
const API_URLS = {
  nodejs: 'http://localhost:5005/api',
  netcore9: 'http://localhost:5002/api'
};

// Select API based on configuration
const API_BASE_URL = API_URLS[API_CHOICE.backend] || API_URLS.netcore9;

// Display which API is being used
console.log(`%c📡 API Backend: ${API_CHOICE.backend.toUpperCase()}`, 'color: #00aa00; font-weight: bold;');
console.log(`%c🔗 API Base URL: ${API_BASE_URL}`, 'color: #0066cc; font-weight: bold;');

// Helper function to switch API at runtime (for debugging)
window.switchAPI = function(backend) {
  if (API_URLS[backend]) {
    API_CHOICE.backend = backend;
    console.log(`✅ Switched to ${backend} API: ${API_URLS[backend]}`);
    return true;
  } else {
    console.error(`❌ Unknown backend: ${backend}. Choose 'nodejs' or 'netcore9'`);
    return false;
  }
};

// Export for use in modules (if using modules)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { API_BASE_URL, API_CHOICE, API_URLS };
}