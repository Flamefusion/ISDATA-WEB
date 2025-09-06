// src/utils/api.js

const getApiUrl = () => {
  // VITE_API_URL will be set by Render in production.
  // For local development, it will be undefined, and we'll use a relative path.
  return import.meta.env.VITE_API_URL || '';
};

export const apiFetch = async (url, options) => {
  const apiUrl = getApiUrl();
  const fullUrl = `${apiUrl}${url}`;
  
  return fetch(fullUrl, options);
};
