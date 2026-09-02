function getApiUrl() {
  const configuredUrl = import.meta.env.VITE_API_URL;

  if (configuredUrl) {
    return String(configuredUrl).replace(/\/$/, '');
  }

  if (import.meta.env.DEV) {
    return 'http://localhost:5000';
  }

  return '';
}

const API_URL = getApiUrl();

export default API_URL;
