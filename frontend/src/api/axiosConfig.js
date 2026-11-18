import axios from 'axios';

export const TOKEN_STORAGE_KEY = 'campusconnect_jwt_token';
export const USER_STORAGE_KEY = 'campusconnect_user';

// Central backend API base URL.
// Defaults to '/api' so Vite proxies requests cleanly to http://localhost:8081/api without CORS issues.
// Set VITE_API_BASE_URL in .env if pointing directly to a CORS-enabled backend URL.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const requestUrl = error.config?.url || '';
      const isAuthEndpoint =
        requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');

      if (!isAuthEndpoint) {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
        window.dispatchEvent(new CustomEvent('campusconnect:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
