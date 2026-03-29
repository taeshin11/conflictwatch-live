/* === ConflictWatch Configuration === */
const CONFIG = {
  // ACLED API — replace with your own key
  // Get one at: https://developer.acleddata.com/
  acled: {
    baseUrl: 'https://api.acleddata.com/acled/read',
    key: 'YOUR_ACLED_API_KEY',
    email: 'YOUR_ACLED_EMAIL',
    limit: 500,
    daysBack: 30
  },

  // Fallback data sources
  fallback: {
    gdeltUrl: 'https://api.gdeltproject.org/api/v2/doc/doc',
    reliefwebUrl: 'https://api.reliefweb.int/v1/reports'
  },

  // Google Sheets webhook for analytics
  sheetWebhookUrl: 'YOUR_APPS_SCRIPT_WEB_APP_URL',

  // Map defaults
  map: {
    center: [20, 10],
    zoom: 2,
    minZoom: 2,
    maxZoom: 18,
    tileLight: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    tileDark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    tileAttribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
  },

  // Data refresh interval (ms)
  refreshInterval: 30 * 60 * 1000, // 30 minutes

  // Event type mappings
  eventTypes: {
    'Battles': { color: '#E74C3C', icon: '⚔️', severity: 'critical' },
    'Explosions/Remote violence': { color: '#E74C3C', icon: '💥', severity: 'critical' },
    'Violence against civilians': { color: '#E67E22', icon: '⚠️', severity: 'high' },
    'Protests': { color: '#F1C40F', icon: '✊', severity: 'medium' },
    'Riots': { color: '#F1C40F', icon: '🔥', severity: 'medium' },
    'Strategic developments': { color: '#3498DB', icon: '📋', severity: 'low' }
  },

  // Regions for filtering
  regions: {
    'All Regions': null,
    'Africa': ['Northern Africa', 'Western Africa', 'Middle Africa', 'Eastern Africa', 'Southern Africa'],
    'Americas': ['North America', 'Central America', 'South America', 'Caribbean'],
    'Asia': ['Central Asia', 'Eastern Asia', 'Southern Asia', 'South-Eastern Asia', 'Western Asia'],
    'Europe': ['Northern Europe', 'Western Europe', 'Eastern Europe', 'Southern Europe'],
    'Middle East': ['Middle East'],
    'Oceania': ['Oceania', 'Australia and New Zealand']
  }
};

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
