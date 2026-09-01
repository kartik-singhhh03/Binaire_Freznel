function getApiUrl() {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  if (import.meta.env.DEV) {
    return 'http://localhost:5000';
  }

  return '';
}

const API_URL = getApiUrl();

export default API_URL;
